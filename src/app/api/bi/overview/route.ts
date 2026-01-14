import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

type ServiceRow = {
  ym: string;
  serviceType: string;
  total: bigint | number;
  revenue: bigint | number | null;
};

type PartsRow = {
  ym: string;
  category: string;
  quantity: bigint | number;
  amount: bigint | number | null;
};

const SERVICE_KEYS = [
  { key: "tuning", label: "Tuning" },
  { key: "engine_rebuild", label: "Engine Rebuild" },
  { key: "race_preparation", label: "Race Preparation" },
  { key: "other", label: "Lainnya" },
];

function normalizeServiceType(input: string) {
  const raw = input.toLowerCase().trim();
  if (raw.includes("tuning")) return "tuning";
  if (raw.includes("engine")) return "engine_rebuild";
  if (raw.includes("rebuild")) return "engine_rebuild";
  if (raw.includes("race")) return "race_preparation";
  if (raw.includes("preparation")) return "race_preparation";
  return "other";
}

function monthKeyToDate(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function addMonths(monthKey: string, offset: number) {
  const date = monthKeyToDate(monthKey);
  date.setUTCMonth(date.getUTCMonth() + offset);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function rollingForecast(series: { month: string; value: number }[], monthsAhead = 3) {
  if (!series.length) return [];
  const sorted = [...series].sort((a, b) => a.month.localeCompare(b.month));
  const lastMonth = sorted[sorted.length - 1].month;
  const values = sorted.map((s) => s.value);
  const forecasts: { month: string; value: number }[] = [];

  for (let i = 1; i <= monthsAhead; i += 1) {
    const window = values.slice(-3);
    const avg = window.reduce((acc, v) => acc + v, 0) / window.length;
    const nextMonth = addMonths(lastMonth, i);
    const nextValue = Math.round(avg);
    forecasts.push({ month: nextMonth, value: nextValue });
    values.push(nextValue);
  }

  return forecasts;
}

function holtWintersForecast(
  series: { month: string; value: number }[],
  seasonLength = 12,
  monthsAhead = 3,
  alpha = 0.4,
  beta = 0.2,
  gamma = 0.3
) {
  const sorted = [...series].sort((a, b) => a.month.localeCompare(b.month));
  if (sorted.length < seasonLength * 2) {
    return { model: "moving_average", forecast: rollingForecast(sorted, monthsAhead) };
  }

  const values = sorted.map((s) => s.value);
  const lastMonth = sorted[sorted.length - 1].month;
  const seasonals: number[] = new Array(seasonLength).fill(0);

  const season1 = values.slice(0, seasonLength);
  const season2 = values.slice(seasonLength, seasonLength * 2);
  const seasonAvg1 = season1.reduce((acc, v) => acc + v, 0) / seasonLength;
  const seasonAvg2 = season2.reduce((acc, v) => acc + v, 0) / seasonLength;

  for (let i = 0; i < seasonLength; i += 1) {
    seasonals[i] = season1[i] - seasonAvg1;
  }

  let level = seasonAvg1;
  let trend = (seasonAvg2 - seasonAvg1) / seasonLength;

  for (let i = 0; i < values.length; i += 1) {
    const idx = i % seasonLength;
    const val = values[i];
    const lastLevel = level;
    const lastTrend = trend;
    const lastSeason = seasonals[idx];

    level = alpha * (val - lastSeason) + (1 - alpha) * (lastLevel + lastTrend);
    trend = beta * (level - lastLevel) + (1 - beta) * lastTrend;
    seasonals[idx] = gamma * (val - level) + (1 - gamma) * lastSeason;
  }

  const forecast: { month: string; value: number }[] = [];
  for (let i = 1; i <= monthsAhead; i += 1) {
    const idx = (values.length + i - 1) % seasonLength;
    const next = level + i * trend + seasonals[idx];
    forecast.push({ month: addMonths(lastMonth, i), value: Math.max(0, Math.round(next)) });
  }

  return { model: "holt_winters", forecast };
}

function buildSeasonality(series: { month: string; value: number }[]) {
  const buckets = new Map<number, number[]>();
  series.forEach((point) => {
    const date = monthKeyToDate(point.month);
    const month = date.getUTCMonth();
    const list = buckets.get(month) || [];
    list.push(point.value);
    buckets.set(month, list);
  });

  const monthlyAvg = Array.from({ length: 12 }, (_, idx) => {
    const values = buckets.get(idx) || [];
    const avg = values.length ? values.reduce((acc, v) => acc + v, 0) / values.length : 0;
    return avg;
  });

  const overallAvg =
    monthlyAvg.reduce((acc, v) => acc + v, 0) / (monthlyAvg.length || 1);

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  return monthlyAvg.map((avg, idx) => ({
    month: monthLabels[idx],
    average: Math.round(avg),
    index: overallAvg ? Number((avg / overallAvg).toFixed(2)) : 0,
  }));
}

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "bi_view");

    const serviceRows = await prisma.$queryRaw<ServiceRow[]>`
      SELECT DATE_FORMAT(scheduledDate, '%Y-%m') as ym,
             serviceType,
             COUNT(*) as total,
             SUM(COALESCE(totalCost, 0)) as revenue
      FROM ServiceOrder
      GROUP BY ym, serviceType
      ORDER BY ym ASC
    `;

    const partsRows = await prisma.$queryRaw<PartsRow[]>`
      SELECT DATE_FORMAT(f.transactionDate, '%Y-%m') as ym,
             p.category as category,
             SUM(f.quantity) as quantity,
             SUM(f.amount) as amount
      FROM FactInventory f
      JOIN Product p ON f.productId = p.id
      WHERE f.type = 'OUT'
      GROUP BY ym, category
      ORDER BY ym ASC
    `;

    const serviceTrendMap = new Map<string, Record<string, number>>();
    const revenueMap = new Map<string, number>();

    serviceRows.forEach((row) => {
      if (!row.ym) return;
      const key = row.ym;
      const serviceKey = normalizeServiceType(row.serviceType || "");
      const existing = serviceTrendMap.get(key) || {};
      existing[serviceKey] = (existing[serviceKey] || 0) + Number(row.total || 0);
      serviceTrendMap.set(key, existing);
      revenueMap.set(key, (revenueMap.get(key) || 0) + Number(row.revenue || 0));
    });

    const serviceTrends = Array.from(serviceTrendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month,
        ...SERVICE_KEYS.reduce((acc, item) => {
          acc[item.key] = values[item.key] || 0;
          return acc;
        }, {} as Record<string, number>),
        total: Object.values(values).reduce((acc, v) => acc + v, 0),
        revenue: revenueMap.get(month) || 0,
      }));

    const categoryTotals = new Map<string, number>();
    partsRows.forEach((row) => {
      const total = Number(row.quantity || 0);
      categoryTotals.set(row.category, (categoryTotals.get(row.category) || 0) + total);
    });

    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category]) => category);

    const partsTrendMap = new Map<string, Record<string, number>>();
    partsRows.forEach((row) => {
      if (!row.ym) return;
      const key = row.ym;
      const entry = partsTrendMap.get(key) || {};
      if (topCategories.includes(row.category)) {
        entry[row.category] = (entry[row.category] || 0) + Number(row.quantity || 0);
      }
      partsTrendMap.set(key, entry);
    });

    const partsTrends = Array.from(partsTrendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month,
        ...topCategories.reduce((acc, category) => {
          acc[category] = values[category] || 0;
          return acc;
        }, {} as Record<string, number>),
      }));

    const serviceSeries = serviceTrends.map((row) => ({
      month: row.month,
      value: row.total || 0,
    }));
    const partsSeries = partsTrends.map((row) => ({
      month: row.month,
      value: Object.values(row).reduce((acc, v) => (typeof v === "number" ? acc + v : acc), 0),
    }));
    const revenueSeries = serviceTrends.map((row) => ({
      month: row.month,
      value: row.revenue || 0,
    }));

    const serviceForecastResult = holtWintersForecast(serviceSeries, 12, 3);
    const partsForecastResult = holtWintersForecast(partsSeries, 12, 3);
    const revenueForecastResult = holtWintersForecast(revenueSeries, 12, 3);

    const seasonality = buildSeasonality(serviceSeries);

    const totalService = serviceSeries.reduce((acc, s) => acc + s.value, 0);
    const totalParts = partsSeries.reduce((acc, s) => acc + s.value, 0);
    const totalRevenue = revenueSeries.reduce((acc, s) => acc + s.value, 0);
    const peakSeason = seasonality.reduce((prev, curr) => (curr.index > prev.index ? curr : prev), seasonality[0]);

    const insights = [
      {
        title: "Kategori sparepart dominan",
        detail: topCategories.length ? `Kategori teratas: ${topCategories.join(", ")}` : "Belum ada transaksi sparepart keluar.",
        level: "info",
      },
      {
        title: "Bulan paling ramai",
        detail: peakSeason ? `Puncak aktivitas di ${peakSeason.month} (indeks ${peakSeason.index})` : "Belum ada data musiman.",
        level: "highlight",
      },
      {
        title: "Forecast 3 bulan",
        detail: serviceForecast.length
          ? `Estimasi ${serviceForecast[0].month} - ${serviceForecast[serviceForecast.length - 1].month}.`
          : "Belum cukup data untuk prediksi.",
        level: "neutral",
      },
    ];

    return new Response(
      JSON.stringify({
        summary: {
          totalService,
          totalParts,
          totalRevenue,
          peakSeasonMonth: peakSeason?.month || "-",
        },
        serviceTrends,
        serviceKeys: SERVICE_KEYS,
        partsTrends,
        topCategories,
        seasonality,
        forecast: {
          service: serviceForecastResult.forecast,
          parts: partsForecastResult.forecast,
          revenue: revenueForecastResult.forecast,
          model: {
            service: serviceForecastResult.model,
            parts: partsForecastResult.model,
            revenue: revenueForecastResult.model,
          },
        },
        insights,
      }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "BI overview error" }), { status: 500 });
  }
}

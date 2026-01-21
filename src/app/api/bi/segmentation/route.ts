import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

type TypeAgg = {
  ym: string;
  type: string | null;
  total: bigint | number;
};

type VehicleAgg = {
  ym: string;
  brand: string | null;
  model: string | null;
  total: bigint | number;
};

const TYPE_KEYS = ["INDIVIDU", "KOMUNITAS", "RACING_TEAM", "UNKNOWN"];

function bucketFrequency(count: number) {
  if (count >= 6) return "Loyal";
  if (count >= 3) return "Repeat";
  return "New";
}

function bucketValue(amount: number) {
  if (amount >= 1500000) return "High Value";
  if (amount >= 500000) return "Mid Value";
  return "Low Value";
}

function normalizeCustomerType(value?: string | null) {
  if (!value) return "UNKNOWN";
  const normalized = value.toUpperCase();
  if (normalized === "INDIVIDU") return "INDIVIDU";
  if (normalized === "KOMUNITAS") return "KOMUNITAS";
  if (normalized === "RACING_TEAM") return "RACING_TEAM";
  return "UNKNOWN";
}

function vehicleName(brand?: string | null, model?: string | null) {
  const safeBrand = (brand || "").trim();
  const safeModel = (model || "").trim();
  return [safeBrand, safeModel].filter(Boolean).join(" ");
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
    const nextValue = Math.max(0, Math.round(avg));
    forecasts.push({ month: nextMonth, value: nextValue });
    values.push(nextValue);
  }

  return forecasts;
}

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "bi_view");

    const customers = await prisma.customer.findMany({
      include: { vehicles: true, serviceOrders: true },
    });

    const enriched = customers.map((customer) => {
      const serviceCount = customer.serviceOrders.length;
      const revenue = customer.serviceOrders.reduce((acc, s) => acc + (s.totalCost || 0), 0);
      const frequency = bucketFrequency(serviceCount);
      const valueTier = bucketValue(revenue);
      const vehicleBrands = customer.vehicles.map((v) => v.brand).filter(Boolean) as string[];
      return {
        id: customer.id,
        frequency,
        valueTier,
        vehicleBrands,
        customerType: customer.customerType || null,
      };
    });

    const byFrequency: Record<string, number> = { Loyal: 0, Repeat: 0, New: 0 };
    const byValue: Record<string, number> = { "High Value": 0, "Mid Value": 0, "Low Value": 0 };
    enriched.forEach((c) => {
      byFrequency[c.frequency] = (byFrequency[c.frequency] || 0) + 1;
      byValue[c.valueTier] = (byValue[c.valueTier] || 0) + 1;
    });

    const topBrands = await prisma.vehicle.groupBy({
      by: ["brand"],
      _count: { _all: true },
    });

    const topBrandRows = topBrands
      .filter((v) => v.brand)
      .map((v) => ({ brand: v.brand as string, total: v._count._all }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topVehiclesAgg = await prisma.vehicle.groupBy({
      by: ["brand", "model"],
      _count: { _all: true },
    });

    const topVehicles = topVehiclesAgg
      .map((v) => {
        const name = vehicleName(v.brand, v.model);
        if (!name) return null;
        return { name, total: v._count._all };
      })
      .filter((v): v is { name: string; total: number } => Boolean(v))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const typeAgg = await prisma.customer.groupBy({
      by: ["customerType"],
      _count: { _all: true },
    });

    const typeSegments = typeAgg
      .filter((t) => t.customerType)
      .map((t) => ({ type: t.customerType as string, total: t._count._all }))
      .sort((a, b) => b.total - a.total);

    const typeAggHistory = await prisma.$queryRaw<TypeAgg[]>`
      SELECT DATE_FORMAT(s.scheduledDate, '%Y-%m') as ym,
             COALESCE(c.customerType, 'UNKNOWN') as type,
             COUNT(DISTINCT c.id) as total
      FROM ServiceOrder s
      JOIN Customer c ON s.customerId = c.id
      WHERE s.scheduledDate IS NOT NULL
      GROUP BY ym, type
      ORDER BY ym ASC
    `;

    const historyMonths = Array.from(
      new Set(typeAggHistory.map((row) => row.ym).filter(Boolean))
    ).sort();

    const typeHistoryMap = new Map<string, Record<string, number | string>>();
    historyMonths.forEach((month) => {
      const row: Record<string, number | string> = { month };
      TYPE_KEYS.forEach((key) => {
        row[key] = 0;
      });
      typeHistoryMap.set(month, row);
    });

    typeAggHistory.forEach((row) => {
      if (!row.ym) return;
      const typeKey = normalizeCustomerType(row.type);
      const entry = typeHistoryMap.get(row.ym) || ({ month: row.ym } as Record<string, number | string>);
      if (!typeHistoryMap.has(row.ym)) {
        TYPE_KEYS.forEach((key) => {
          entry[key] = 0;
        });
        typeHistoryMap.set(row.ym, entry);
      }
      entry[typeKey] = Number(entry[typeKey] || 0) + Number(row.total || 0);
    });

    const typeHistory = Array.from(typeHistoryMap.values()).sort((a, b) =>
      String(a.month).localeCompare(String(b.month))
    );

    const monthsAhead = 3;
    const typeForecastMap = new Map<string, Record<string, number | string>>();

    TYPE_KEYS.forEach((key) => {
      const series = typeHistory.map((row) => ({
        month: String(row.month),
        value: Number(row[key] || 0),
      }));
      const forecast = rollingForecast(series, monthsAhead);
      forecast.forEach((point) => {
        const entry = typeForecastMap.get(point.month) || ({ month: point.month } as Record<string, number | string>);
        if (!typeForecastMap.has(point.month)) {
          TYPE_KEYS.forEach((k) => {
            entry[k] = 0;
          });
          typeForecastMap.set(point.month, entry);
        }
        entry[key] = point.value;
      });
    });

    const typeForecast = Array.from(typeForecastMap.values()).sort((a, b) =>
      String(a.month).localeCompare(String(b.month))
    );

    const vehicleKeys = topVehicles.slice(0, 3).map((v) => v.name);
    const vehicleAggHistory = vehicleKeys.length
      ? await prisma.$queryRaw<VehicleAgg[]>`
          SELECT DATE_FORMAT(s.scheduledDate, '%Y-%m') as ym,
                 v.brand as brand,
                 v.model as model,
                 COUNT(DISTINCT s.customerId) as total
          FROM ServiceOrder s
          JOIN Vehicle v ON v.customerId = s.customerId
          WHERE s.scheduledDate IS NOT NULL
          GROUP BY ym, brand, model
          ORDER BY ym ASC
        `
      : [];

    const vehicleHistoryMap = new Map<string, Record<string, number | string>>();
    const vehicleMonths = Array.from(
      new Set(vehicleAggHistory.map((row) => row.ym).filter(Boolean))
    ).sort();
    vehicleMonths.forEach((month) => {
      const row: Record<string, number | string> = { month };
      vehicleKeys.forEach((name) => {
        row[name] = 0;
      });
      vehicleHistoryMap.set(month, row);
    });

    vehicleAggHistory.forEach((row) => {
      if (!row.ym) return;
      const name = vehicleName(row.brand, row.model);
      if (!name || !vehicleKeys.includes(name)) return;
      const entry = vehicleHistoryMap.get(row.ym) || ({ month: row.ym } as Record<string, number | string>);
      if (!vehicleHistoryMap.has(row.ym)) {
        vehicleKeys.forEach((key) => {
          entry[key] = 0;
        });
        vehicleHistoryMap.set(row.ym, entry);
      }
      entry[name] = Number(entry[name] || 0) + Number(row.total || 0);
    });

    const vehicleForecastMap = new Map<string, Record<string, number | string>>();
    vehicleKeys.forEach((name) => {
      const series = Array.from(vehicleHistoryMap.values()).map((row) => ({
        month: String(row.month),
        value: Number(row[name] || 0),
      }));
      const forecast = rollingForecast(series, monthsAhead);
      forecast.forEach((point) => {
        const entry = vehicleForecastMap.get(point.month) || ({ month: point.month } as Record<string, number | string>);
        if (!vehicleForecastMap.has(point.month)) {
          vehicleKeys.forEach((key) => {
            entry[key] = 0;
          });
          vehicleForecastMap.set(point.month, entry);
        }
        entry[name] = point.value;
      });
    });

    const vehicleForecast = Array.from(vehicleForecastMap.values()).sort((a, b) =>
      String(a.month).localeCompare(String(b.month))
    );

    return new Response(
      JSON.stringify({
        summary: {
          totalCustomers: enriched.length,
          byFrequency,
          byValue,
          topBrands: topBrandRows,
          topVehicles,
          typeSegments,
        },
        forecast: {
          monthsAhead,
          typeKeys: TYPE_KEYS,
          typeForecast,
          vehicleKeys,
          vehicleForecast,
        },
      }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "BI segmentation error" }), { status: 500 });
  }
}

import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

type ServiceAgg = {
  month: string;
  total: bigint | number;
};

type PartsAgg = {
  month: string;
  total: bigint | number;
};

function monthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "bi_view");

    const { searchParams } = new URL(req.url);
    const threshold = Number(searchParams.get("threshold") || 25);

    const serviceAgg = await prisma.$queryRaw<ServiceAgg[]>`
      SELECT DATE_FORMAT(scheduledDate, '%Y-%m') as month,
             COUNT(*) as total
      FROM ServiceOrder
      GROUP BY month
      ORDER BY month ASC
    `;

    const partsAgg = await prisma.$queryRaw<PartsAgg[]>`
      SELECT DATE_FORMAT(transactionDate, '%Y-%m') as month,
             SUM(quantity) as total
      FROM FactInventory
      WHERE type = 'OUT'
      GROUP BY month
      ORDER BY month ASC
    `;

    const serviceSeries = serviceAgg.map((row) => ({
      month: row.month,
      value: Number(row.total || 0),
    }));
    const partsSeries = partsAgg.map((row) => ({
      month: row.month,
      value: Number(row.total || 0),
    }));

    const alerts: Array<{
      title: string;
      detail: string;
      change: number;
      month: string;
      metric: string;
      level: string;
    }> = [];

    const checkSeries = (series: { month: string; value: number }[], metric: string) => {
      for (let i = 1; i < series.length; i += 1) {
        const prev = series[i - 1];
        const curr = series[i];
        const change = percentChange(curr.value, prev.value);
        if (Math.abs(change) >= threshold) {
          alerts.push({
            title: `${metric} berubah ${change > 0 ? "naik" : "turun"}`,
            detail: `${curr.month} ${metric.toLowerCase()} ${curr.value} (${change.toFixed(1)}% vs ${prev.month}).`,
            change: Number(change.toFixed(1)),
            month: curr.month,
            metric,
            level: change > 0 ? "positive" : "warning",
          });
        }
      }
    };

    checkSeries(serviceSeries, "Servis");
    checkSeries(partsSeries, "Suku cadang keluar");

    const lastMonth = monthKey(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const lastService = serviceSeries.find((s) => s.month === lastMonth);
    const lastParts = partsSeries.find((s) => s.month === lastMonth);

    return new Response(
      JSON.stringify({
        threshold,
        latest: {
          month: lastMonth,
          service: lastService?.value || 0,
          parts: lastParts?.value || 0,
        },
        alerts,
      }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "BI alert error" }), { status: 500 });
  }
}

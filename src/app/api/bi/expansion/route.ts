import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

type MonthlyRow = {
  month: string;
  total: bigint | number;
  revenue: bigint | number | null;
};

function monthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function addMonths(month: string, offset: number) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  date.setUTCMonth(date.getUTCMonth() + offset);
  return monthKey(new Date(date));
}

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "bi_view");

    const months = Number(new URL(req.url).searchParams.get("months") || 3);

    const rows = await prisma.$queryRaw<MonthlyRow[]>`
      SELECT DATE_FORMAT(scheduledDate, '%Y-%m') as month,
             COUNT(*) as total,
             SUM(COALESCE(totalCost, 0)) as revenue
      FROM ServiceOrder
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `;

    const history = rows
      .map((r) => ({
        month: r.month,
        total: Number(r.total || 0),
        revenue: Number(r.revenue || 0),
      }))
      .reverse();

    const base = history.slice(-3);
    const avgServices =
      base.reduce((acc, r) => acc + r.total, 0) / (base.length || 1);
    const avgRevenue =
      base.reduce((acc, r) => acc + r.revenue, 0) / (base.length || 1);

    const scenarios = [
      { name: "Conservative", growth: 0.1 },
      { name: "Moderate", growth: 0.25 },
      { name: "Aggressive", growth: 0.4 },
    ];

    const lastMonth = history.length ? history[history.length - 1].month : monthKey(new Date());

    const projections = scenarios.map((s) => {
      const items: Array<{ month: string; services: number; revenue: number }> = [];
      for (let i = 1; i <= months; i += 1) {
        const month = addMonths(lastMonth, i);
        const factor = 1 + s.growth * i;
        items.push({
          month,
          services: Math.round(avgServices * factor),
          revenue: Math.round(avgRevenue * factor),
        });
      }
      return { scenario: s.name, growth: s.growth, items };
    });

    return new Response(
      JSON.stringify({
        history,
        baseAverage: { services: Math.round(avgServices), revenue: Math.round(avgRevenue) },
        projections,
      }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "BI expansion error" }), { status: 500 });
  }
}

import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

type SegmentRow = {
  customerId: string;
  serviceCount: number;
  revenue: number;
  lastServiceAt: Date | null;
};

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

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_view");

    const serviceAgg = await prisma.serviceOrder.groupBy({
      by: ["customerId"],
      where: { customerId: { not: null } },
      _count: { _all: true },
      _sum: { totalCost: true },
      _max: { completedDate: true, scheduledDate: true },
    });

    const customerIds = serviceAgg.map((row) => row.customerId!).filter(Boolean);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      include: { vehicles: true },
    });
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    const segments: SegmentRow[] = serviceAgg.map((row) => ({
      customerId: row.customerId!,
      serviceCount: row._count._all,
      revenue: row._sum.totalCost ? Number(row._sum.totalCost) : 0,
      lastServiceAt: row._max.completedDate || row._max.scheduledDate || null,
    }));

    const enriched = segments
      .map((s) => {
        const customer = customerMap.get(s.customerId);
        if (!customer) return null;
        const frequency = bucketFrequency(s.serviceCount);
        const valueTier = bucketValue(s.revenue);
        const vehicleBrands = customer.vehicles.map((v) => v.brand).filter(Boolean) as string[];
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          serviceCount: s.serviceCount,
          revenue: s.revenue,
          lastServiceAt: s.lastServiceAt,
          frequency,
          valueTier,
          vehicleBrands,
          preferredService: customer.preferredService,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      serviceCount: number;
      revenue: number;
      lastServiceAt: Date | null;
      frequency: string;
      valueTier: string;
      vehicleBrands: string[];
      preferredService?: string | null;
    }>;

    const byFrequency: Record<string, number> = { Loyal: 0, Repeat: 0, New: 0 };
    const byValue: Record<string, number> = { "High Value": 0, "Mid Value": 0, "Low Value": 0 };
    enriched.forEach((c) => {
      byFrequency[c.frequency] = (byFrequency[c.frequency] || 0) + 1;
      byValue[c.valueTier] = (byValue[c.valueTier] || 0) + 1;
    });

    const vehicleAgg = await prisma.vehicle.groupBy({
      by: ["brand"],
      _count: { _all: true },
    });

    const topBrands = vehicleAgg
      .filter((v) => v.brand)
      .map((v) => ({ brand: v.brand as string, total: v._count._all }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const sortedByRevenue = [...enriched].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const sortedByActivity = [...enriched].sort((a, b) => b.serviceCount - a.serviceCount).slice(0, 5);

    const now = new Date();
    const inactive = enriched.filter((c) => {
      if (!c.lastServiceAt) return true;
      const diff = now.getTime() - new Date(c.lastServiceAt).getTime();
      return diff > 1000 * 60 * 60 * 24 * 60;
    });

    const recommendations = [
      {
        title: "Fokus pelanggan loyal",
        detail: `${byFrequency.Loyal} pelanggan loyal bisa ditawarkan program membership atau paket service premium.`,
        level: "priority",
      },
      {
        title: "Reaktivasi pelanggan pasif",
        detail: `${inactive.length} pelanggan belum servis 60+ hari. Kirim reminder & promo perawatan berkala.`,
        level: "alert",
      },
      {
        title: "Segmentasi kendaraan populer",
        detail: topBrands.length
          ? `Brand terbanyak: ${topBrands.map((b) => b.brand).join(", ")}. Buat paket layanan khusus brand ini.`
          : "Belum ada data kendaraan untuk segmentasi brand.",
        level: "info",
      },
    ];

    return new Response(
      JSON.stringify({
        segments: enriched,
        summary: {
          totalCustomers: enriched.length,
          byFrequency,
          byValue,
          topBrands,
        },
        highlights: {
          topRevenue: sortedByRevenue,
          topActivity: sortedByActivity,
          inactive: inactive.slice(0, 5),
        },
        recommendations,
      }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM segmentation error" }), { status: 500 });
  }
}

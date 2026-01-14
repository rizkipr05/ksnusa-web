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

    const customers = await prisma.customer.findMany({
      include: { vehicles: true, serviceOrders: true },
    });

    const enriched = customers.map((customer) => {
      const serviceCount = customer.serviceOrders.length;
      const revenue = customer.serviceOrders.reduce((acc, s) => acc + (s.totalCost || 0), 0);
      const lastServiceAt = customer.serviceOrders.reduce<Date | null>((latest, s) => {
        const date = (s.completedDate || s.scheduledDate) as Date;
        if (!date) return latest;
        if (!latest || date > latest) return date;
        return latest;
      }, null);
      const frequency = bucketFrequency(serviceCount);
      const valueTier = bucketValue(revenue);
      const vehicleBrands = customer.vehicles.map((v) => v.brand).filter(Boolean) as string[];
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        serviceCount,
        revenue,
        lastServiceAt,
        frequency,
        valueTier,
        vehicleBrands,
        preferredService: customer.preferredService,
      };
    });

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

    const typeAgg = await prisma.customer.groupBy({
      by: ["customerType"],
      _count: { _all: true },
    });

    const typeSegments = typeAgg
      .filter((t) => t.customerType)
      .map((t) => ({ type: t.customerType as string, total: t._count._all }))
      .sort((a, b) => b.total - a.total);

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

    const brandSegments = topBrands.map((brand) => ({
      name: `${brand.brand} Owners`,
      size: brand.total,
      reason: "Brand dominan pada database pelanggan.",
      suggestion: `Kampanye servis khusus ${brand.brand} + paket sparepart.`,
    }));

    const premiumTargets = enriched
      .filter((c) => c.valueTier === "High Value" && c.frequency !== "Loyal")
      .map((c) => ({
        name: c.name,
        size: 1,
        reason: "High value tapi belum loyal.",
        suggestion: "Penawaran loyalty upgrade + paket servis premium.",
      }))
      .slice(0, 5);

    const untappedSegments = [
      {
        name: "Racing Team",
        size: 0,
        reason: "Belum ada label khusus racing/team. Potensi partnership komunitas balap.",
        suggestion: "Buat paket race prep + kontrak servis periodik.",
      },
      {
        name: "Komunitas Motor",
        size: 0,
        reason: "Belum ada program khusus komunitas.",
        suggestion: "Diskon grup + event gathering servis bersama.",
      },
    ];

    const expansionSegments = [...brandSegments, ...premiumTargets, ...untappedSegments];

    return new Response(
      JSON.stringify({
        segments: enriched,
        summary: {
          totalCustomers: enriched.length,
          byFrequency,
          byValue,
          topBrands,
          typeSegments,
        },
        highlights: {
          topRevenue: sortedByRevenue,
          topActivity: sortedByActivity,
          inactive: inactive.slice(0, 5),
        },
        recommendations,
        expansionSegments,
      }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM segmentation error" }), { status: 500 });
  }
}

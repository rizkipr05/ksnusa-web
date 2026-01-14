import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

type ServiceAgg = {
  serviceType: string;
  total: bigint | number;
  revenue: bigint | number | null;
};

function normalizeServiceType(input: string) {
  const raw = input.toLowerCase();
  if (raw.includes("tuning")) return "tuning";
  if (raw.includes("race")) return "race_prep";
  if (raw.includes("engine") || raw.includes("rebuild")) return "engine_rebuild";
  if (raw.includes("rem")) return "brake";
  if (raw.includes("suspension") || raw.includes("kaki")) return "suspension";
  if (raw.includes("oli")) return "oil";
  return "maintenance";
}

function formatLabel(key: string) {
  const map: Record<string, string> = {
    tuning: "Paket Tuning & Performance",
    race_prep: "Race Preparation Package",
    engine_rebuild: "Engine Rebuild/Overhaul",
    brake: "Brake Performance Package",
    suspension: "Suspension Setup",
    oil: "Oil Subscription Service",
    maintenance: "Servis Berkala Terjadwal",
  };
  return map[key] || key;
}

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "bi_view");

    const serviceAgg = await prisma.serviceOrder.groupBy({
      by: ["serviceType"],
      _count: { _all: true },
      _sum: { totalCost: true },
    });

    const bucketMap = new Map<string, { count: number; revenue: number }>();
    (serviceAgg as ServiceAgg[]).forEach((row) => {
      const key = normalizeServiceType(row.serviceType || "maintenance");
      const entry = bucketMap.get(key) || { count: 0, revenue: 0 };
      entry.count += Number(row.total || row._count?._all || 0);
      entry.revenue += Number(row.revenue || row._sum?.totalCost || 0);
      bucketMap.set(key, entry);
    });

    const partsAgg = await prisma.$queryRaw<Array<{ category: string; total: bigint | number }>>`
      SELECT p.category as category,
             SUM(f.quantity) as total
      FROM FactInventory f
      JOIN Product p ON f.productId = p.id
      WHERE f.type = 'OUT'
      GROUP BY p.category
      ORDER BY total DESC
    `;

    const topParts = partsAgg.slice(0, 3);

    const recommendations: Array<{ title: string; detail: string; type: string }> = [];

    const highDemand = Array.from(bucketMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2);

    highDemand.forEach(([key, stat]) => {
      recommendations.push({
        title: formatLabel(key),
        detail: `Permintaan tinggi (${stat.count} servis). Rekomendasikan paket premium + add-on.`,
        type: "upsell",
      });
    });

    const lowPresence = ["engine_rebuild", "race_prep", "suspension"].filter(
      (key) => (bucketMap.get(key)?.count || 0) < 2
    );

    if (topParts.find((p) => p.category?.toLowerCase().includes("mesin")) && lowPresence.includes("engine_rebuild")) {
      recommendations.push({
        title: "Engine Rebuild/Overhaul",
        detail: "Kategori mesin tinggi, namun layanan rebuild masih sedikit. Potensi paket overhaul.",
        type: "new_service",
      });
    }

    if (topParts.find((p) => p.category?.toLowerCase().includes("kaki")) && lowPresence.includes("suspension")) {
      recommendations.push({
        title: "Suspension Setup",
        detail: "Suku cadang kaki-kaki dominan. Tawarkan paket set-up suspensi.",
        type: "new_service",
      });
    }

    if (topParts.find((p) => p.category?.toLowerCase().includes("oli"))) {
      recommendations.push({
        title: "Oil Subscription Service",
        detail: "Penjualan oli tinggi. Buat program langganan ganti oli berkala.",
        type: "recurring",
      });
    }

    if (!recommendations.length) {
      recommendations.push({
        title: "Perlu lebih banyak data",
        detail: "Data servis belum cukup untuk rekomendasi layanan baru.",
        type: "info",
      });
    }

    return new Response(
      JSON.stringify({
        topParts,
        recommendations,
      }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "BI recommendation error" }), { status: 500 });
  }
}

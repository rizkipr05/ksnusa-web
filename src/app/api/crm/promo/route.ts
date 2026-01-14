import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

type Candidate = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  tier: string;
  lastServiceAt: Date | null;
  valueTier: string;
};

function valueTierFor(amount: number) {
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
      include: {
        loyaltyProfile: true,
        serviceOrders: true,
      },
    });

    const candidates: Candidate[] = customers.map((c) => {
      const lastService = c.serviceOrders.sort((a, b) =>
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      )[0];
      const revenue = c.serviceOrders.reduce((acc, s) => acc + (s.totalCost || 0), 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        tier: c.loyaltyProfile?.tier || "Silver",
        lastServiceAt: lastService?.scheduledDate || null,
        valueTier: valueTierFor(revenue),
      };
    });

    const now = Date.now();
    const idleCandidates = candidates.filter((c) => {
      if (!c.lastServiceAt) return true;
      return now - new Date(c.lastServiceAt).getTime() > 1000 * 60 * 60 * 24 * 45;
    });

    const promoList = idleCandidates.map((c) => ({
      ...c,
      promoTitle: "Promo Servis Berkala",
      message: `Halo ${c.name}, ada promo servis berkala untuk pelanggan ${c.valueTier}. Yuk booking minggu ini!`,
    }));

    return new Response(JSON.stringify({ result: promoList }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Promo error" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_manage");

    const body = await req.json();
    const { customerIds, campaign, message } = body || {};
    if (!Array.isArray(customerIds) || !customerIds.length || !message) {
      return new Response(JSON.stringify({ error: "customerIds dan message wajib diisi" }), { status: 400 });
    }

    const created = await prisma.communicationLog.createMany({
      data: customerIds.map((id: string) => ({
        customerId: id,
        type: "PROMO",
        channel: "WhatsApp",
        message,
        status: "SENT",
        sentAt: new Date(),
        source: "AUTO",
        campaign: campaign || "Promo Personal",
      })),
    });

    return new Response(JSON.stringify({ created: created.count }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Promo error" }), { status: 500 });
  }
}

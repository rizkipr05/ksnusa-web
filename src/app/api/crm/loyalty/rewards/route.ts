import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_view");

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    if (!customerId) {
      return new Response(JSON.stringify({ error: "customerId wajib diisi" }), { status: 400 });
    }

    const rewards = await prisma.reward.findMany({
      where: { customerId },
      orderBy: { issuedAt: "desc" },
    });

    return new Response(JSON.stringify({ result: rewards }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Loyalty error" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_manage");

    const body = await req.json();
    const { rewardId } = body || {};
    if (!rewardId) {
      return new Response(JSON.stringify({ error: "rewardId wajib diisi" }), { status: 400 });
    }

    const reward = await prisma.reward.update({
      where: { id: rewardId },
      data: { status: "REDEEMED", redeemedAt: new Date() },
    });

    return new Response(JSON.stringify({ reward }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Loyalty error" }), { status: 500 });
  }
}

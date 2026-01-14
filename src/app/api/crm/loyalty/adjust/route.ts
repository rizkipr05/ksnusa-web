import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

function tierFor(points: number) {
  if (points >= 1500) return "Platinum";
  if (points >= 500) return "Gold";
  return "Silver";
}

export async function POST(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_manage");

    const body = await req.json();
    const { customerId, points, reason } = body || {};

    if (!customerId || typeof points !== "number" || !Number.isFinite(points)) {
      return new Response(JSON.stringify({ error: "Customer dan poin wajib diisi" }), { status: 400 });
    }

    const profile = await prisma.loyaltyProfile.upsert({
      where: { customerId },
      create: {
        customerId,
        points: points,
        lifetimePoints: points > 0 ? points : 0,
        tier: tierFor(points > 0 ? points : 0),
      },
      update: {},
    });

    const newPoints = profile.points + points;
    const newLifetime = profile.lifetimePoints + (points > 0 ? points : 0);
    const newTier = tierFor(newLifetime);

    const updated = await prisma.loyaltyProfile.update({
      where: { id: profile.id },
      data: {
        points: newPoints,
        lifetimePoints: newLifetime,
        tier: newTier,
      },
    });

    await prisma.loyaltyTransaction.create({
      data: {
        profileId: profile.id,
        points,
        type: points >= 0 ? "EARN" : "REDEEM",
        reason: reason || "Manual adjustment",
      },
    });

    return new Response(JSON.stringify({ profile: updated }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Loyalty error" }), { status: 500 });
  }
}

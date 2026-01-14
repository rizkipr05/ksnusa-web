import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

export async function GET(req: Request, { params }: { params: { customerId: string } }) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_view");

    const profile = await prisma.loyaltyProfile.findUnique({
      where: { customerId: params.customerId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!profile) {
      return new Response(JSON.stringify({ result: [] }), { status: 200 });
    }

    return new Response(JSON.stringify({ result: profile.transactions }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Loyalty error" }), { status: 500 });
  }
}

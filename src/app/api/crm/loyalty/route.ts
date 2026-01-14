import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_view");

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        loyaltyProfile: true,
      },
    });

    const result = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      profile: c.loyaltyProfile || null,
    }));

    return new Response(JSON.stringify({ result }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Loyalty error" }), { status: 500 });
  }
}

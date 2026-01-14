import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "orders_view");

    const orders = await prisma.factInventory.findMany({
      orderBy: { transactionDate: 'desc' },
      include: { 
        product: true, 
        supplier: true 
      }
    });

    return new Response(JSON.stringify({ orders }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Orders error" }), { status: 500 });
  }
}

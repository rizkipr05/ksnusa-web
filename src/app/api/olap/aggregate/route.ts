import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

type GroupBy = "category" | "supplier" | "date";

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "bi_view");

    const { searchParams } = new URL(req.url);
    const groupBy = (searchParams.get("groupBy") as GroupBy) || "category";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const type = searchParams.get("type"); // IN | OUT
    const category = searchParams.get("category");
    const supplierId = searchParams.get("supplierId");

    const where: any = {};
    if (type) where.type = type;
    if (from || to) {
      where.transactionDate = {};
      if (from) where.transactionDate.gte = new Date(from);
      if (to) where.transactionDate.lte = new Date(to);
    }

    const facts = await prisma.factInventory.findMany({
      where,
      include: { product: true, supplier: true },
    });

    const filtered = facts.filter((f) => {
      if (category && f.product.category !== category) return false;
      if (supplierId && f.supplierId !== supplierId) return false;
      return true;
    });

    const agg: Record<string, { quantity: number; amount: number; items: number; itemNames: string[] }> = {};

    for (const f of filtered) {
      let key = "";
      if (groupBy === "category") key = f.product.category;
      else if (groupBy === "supplier") key = f.supplier.name;
      else if (groupBy === "date") key = f.transactionDate.toISOString().substring(0, 10);
      else key = "unknown";

      if (!agg[key]) agg[key] = { quantity: 0, amount: 0, items: 0, itemNames: [] };
      agg[key].quantity += f.quantity;
      agg[key].amount += f.amount;
      agg[key].items += 1;
      if (!agg[key].itemNames.includes(f.product.name)) {
        agg[key].itemNames.push(f.product.name);
      }
    }

    const result = Object.entries(agg).map(([label, v]) => ({ label, ...v }));

    return new Response(JSON.stringify({ groupBy, result }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "OLAP error" }), { status: 500 });
  }
}

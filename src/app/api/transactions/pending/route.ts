import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";
    
    const transactions = await prisma.factInventory.findMany({
      where: { 
        type: "IN",
        approvalStatus: status
      },
      include: { 
        product: true, 
        supplier: true,
        approvedBy: { select: { name: true, email: true } },
        signature: true
      },
      orderBy: { transactionDate: 'desc' }
    });

    return new Response(JSON.stringify({ transactions }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Error" }), { status: 500 });
  }
}

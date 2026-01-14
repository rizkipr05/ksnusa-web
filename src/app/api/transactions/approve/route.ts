import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    if (!['OWNER','ADMIN'].includes(payload.role)) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    const { factId, decision, signatureBase64 } = await req.json();
    if (!factId || !decision) return new Response(JSON.stringify({ error: "factId dan decision wajib" }), { status: 400 });

    const fact = await prisma.factInventory.findUnique({ where: { id: factId } });
    if (!fact) return new Response(JSON.stringify({ error: "Transaksi tidak ditemukan" }), { status: 404 });
    if (fact.type !== 'IN') return new Response(JSON.stringify({ error: "Hanya transaksi barang masuk (IN) yang dapat di-approve" }), { status: 400 });

    let signatureId: string | null = null;
    if (decision === 'APPROVED' && signatureBase64) {
      const sig = await prisma.signature.create({ data: { imageData: signatureBase64, signerUserId: payload.id } });
      signatureId = sig.id;
    }

    const updated = await prisma.factInventory.update({
      where: { id: factId },
      data: {
        approvalStatus: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        approvedById: payload.id,
        approvedAt: new Date(),
        signatureId: signatureId || undefined,
      },
      include: { product: true, supplier: true, signature: true },
    });

    return new Response(JSON.stringify({ ok: true, fact: updated }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Approval error" }), { status: 500 });
  }
}

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
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { customer: { name: { contains: q } } },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: true, serviceOrder: true },
    });

    return new Response(JSON.stringify({ result: complaints }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM error" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_manage");

    const body = await req.json();
    const { customerId, serviceOrderId, title, description, status, channel } = body || {};
    if (!customerId || !title || !description) {
      return new Response(JSON.stringify({ error: "Customer, judul, dan deskripsi wajib diisi" }), { status: 400 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        customerId,
        serviceOrderId: serviceOrderId || null,
        title,
        description,
        status: status || "OPEN",
        channel: channel || null,
      },
    });

    return new Response(JSON.stringify({ complaint }), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM error" }), { status: 500 });
  }
}

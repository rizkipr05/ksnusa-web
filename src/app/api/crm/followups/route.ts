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
    const type = searchParams.get("type");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (type && type !== "ALL") where.type = type;

    const followups = await prisma.followUp.findMany({
      where,
      orderBy: { dueAt: "asc" },
      include: { customer: true },
    });

    return new Response(JSON.stringify({ result: followups }), { status: 200 });
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
    const { customerId, type, dueAt, message, status } = body || {};
    if (!customerId || !type || !dueAt || !message) {
      return new Response(JSON.stringify({ error: "Customer, tipe, jadwal, dan pesan wajib diisi" }), { status: 400 });
    }

    const followup = await prisma.followUp.create({
      data: {
        customerId,
        type,
        dueAt: new Date(dueAt),
        message,
        status: status || "PENDING",
      },
    });

    return new Response(JSON.stringify({ followup }), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM error" }), { status: 500 });
  }
}

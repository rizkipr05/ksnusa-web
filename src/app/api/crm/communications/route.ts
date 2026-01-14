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

    const logs = await prisma.communicationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    });

    return new Response(JSON.stringify({ result: logs }), { status: 200 });
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
    const { customerId, type, channel, message, status, sentAt } = body || {};
    if (!customerId || !type || !message) {
      return new Response(JSON.stringify({ error: "Customer, tipe, dan pesan wajib diisi" }), { status: 400 });
    }

    const log = await prisma.communicationLog.create({
      data: {
        customerId,
        type,
        channel: channel || null,
        message,
        status: status || "SENT",
        sentAt: sentAt ? new Date(sentAt) : null,
      },
    });

    return new Response(JSON.stringify({ log }), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM error" }), { status: 500 });
  }
}

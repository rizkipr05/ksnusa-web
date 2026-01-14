import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_view");

    const followup = await prisma.followUp.findUnique({
      where: { id: params.id },
      include: { customer: true },
    });

    if (!followup) {
      return new Response(JSON.stringify({ error: "Follow-up not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ followup }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM error" }), { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_manage");

    const body = await req.json();
    const { type, dueAt, message, status, sentAt } = body || {};

    const followup = await prisma.followUp.update({
      where: { id: params.id },
      data: {
        type,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        message,
        status,
        sentAt: sentAt ? new Date(sentAt) : undefined,
      },
    });

    return new Response(JSON.stringify({ followup }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM error" }), { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_manage");

    await prisma.followUp.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM error" }), { status: 500 });
  }
}

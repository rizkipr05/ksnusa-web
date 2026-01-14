import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_view");

    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
      include: { customer: true, serviceOrder: true },
    });

    if (!complaint) {
      return new Response(JSON.stringify({ error: "Complaint not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ complaint }), { status: 200 });
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
    const { title, description, status, channel, resolution } = body || {};

    const complaint = await prisma.complaint.update({
      where: { id: params.id },
      data: {
        title,
        description,
        status,
        channel,
        resolution,
      },
    });

    return new Response(JSON.stringify({ complaint }), { status: 200 });
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

    await prisma.complaint.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM error" }), { status: 500 });
  }
}

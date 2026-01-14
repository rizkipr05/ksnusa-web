import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_view");

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        vehicles: true,
        serviceOrders: {
          orderBy: { scheduledDate: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      return new Response(JSON.stringify({ error: "Customer not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ customer }), { status: 200 });
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
    const { name, email, phone, address, preferredService, notes, customerType } = body || {};

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        preferredService: preferredService || null,
        customerType: customerType || null,
        notes: notes || null,
      },
    });

    return new Response(JSON.stringify({ customer }), { status: 200 });
  } catch (e: any) {
    const message = e?.code === "P2002" ? "Email sudah terdaftar" : e?.message || "CRM error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "crm_manage");

    await prisma.customer.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM error" }), { status: 500 });
  }
}

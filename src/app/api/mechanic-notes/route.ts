import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "mechanic_notes_view");

    const { searchParams } = new URL(req.url);
    const serviceOrderId = searchParams.get("serviceOrderId");
    const where: any = {};
    if (serviceOrderId) where.serviceOrderId = serviceOrderId;
    
    const notes = await prisma.mechanicNote.findMany({ 
      where, 
      orderBy: { createdAt: 'desc' }, 
      include: { 
        createdBy: { select: { id: true, name: true, email: true } },
        serviceOrder: true
      }
    });
    return new Response(JSON.stringify({ notes }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Notes error" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "mechanic_notes_create");

    const { serviceOrderId, content } = await req.json();
    if (!serviceOrderId || !content) return new Response(JSON.stringify({ error: "serviceOrderId dan content wajib" }), { status: 400 });

    // Validate service order exists
    const serviceOrderExists = await prisma.serviceOrder.findUnique({ 
      where: { id: serviceOrderId }
    });
    if (!serviceOrderExists) {
      return new Response(JSON.stringify({ error: "Order Servis tidak ditemukan" }), { status: 404 });
    }

    // Validate user exists
    const userExists = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!userExists) {
      return new Response(JSON.stringify({ error: "User tidak valid. Silakan logout dan login ulang." }), { status: 401 });
    }

    const note = await prisma.mechanicNote.create({ 
      data: { 
        serviceOrderId,
        content, 
        createdById: payload.id 
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        serviceOrder: true
      }
    });
    return new Response(JSON.stringify({ ok: true, note }), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Notes error" }), { status: 500 });
  }
}

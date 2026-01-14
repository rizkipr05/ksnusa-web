import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "orders_view");

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    
    const where: any = {};
    if (status) where.status = status;

    const serviceOrders = await prisma.serviceOrder.findMany({
      where,
      orderBy: { scheduledDate: 'desc' },
      include: { 
        mechanicNotes: {
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return new Response(JSON.stringify({ serviceOrders }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Service orders error" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "orders_create");

    const { orderNumber, customerName, vehicleInfo, serviceType, description, scheduledDate, totalCost } = await req.json();
    
    if (!orderNumber || !customerName || !serviceType) {
      return new Response(
        JSON.stringify({ error: "orderNumber, customerName, dan serviceType wajib diisi" }), 
        { status: 400 }
      );
    }

    // Check if order number already exists
    const existing = await prisma.serviceOrder.findUnique({
      where: { orderNumber }
    });
    
    if (existing) {
      return new Response(
        JSON.stringify({ error: "Nomor order sudah digunakan" }), 
        { status: 400 }
      );
    }

    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        orderNumber,
        customerName,
        vehicleInfo: vehicleInfo || "",
        serviceType,
        description: description || "",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        totalCost: totalCost || 0,
        status: "PENDING"
      },
      include: {
        mechanicNotes: {
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return new Response(JSON.stringify({ ok: true, serviceOrder }), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Service orders error" }), { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    await requirePermission(payload, "orders_edit");

    const { id, status, completedDate, totalCost, description } = await req.json();
    
    if (!id) {
      return new Response(JSON.stringify({ error: "ID wajib diisi" }), { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (completedDate !== undefined) updateData.completedDate = completedDate ? new Date(completedDate) : null;
    if (totalCost !== undefined) updateData.totalCost = totalCost;
    if (description !== undefined) updateData.description = description;

    const serviceOrder = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: {
        mechanicNotes: {
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return new Response(JSON.stringify({ ok: true, serviceOrder }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Service orders error" }), { status: 500 });
  }
}

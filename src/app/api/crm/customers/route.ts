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
    const q = searchParams.get("q")?.trim();

    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : undefined;

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        vehicles: true,
        serviceOrders: {
          select: { id: true },
        },
      },
    });

    const result = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      preferredService: c.preferredService,
      vehicles: c.vehicles,
      serviceCount: c.serviceOrders.length,
      createdAt: c.createdAt,
    }));

    return new Response(JSON.stringify({ result }), { status: 200 });
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
    const { name, email, phone, address, preferredService, notes, vehicle } = body || {};

    if (!name) {
      return new Response(JSON.stringify({ error: "Nama pelanggan wajib diisi" }), { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        preferredService: preferredService || null,
        notes: notes || null,
        vehicles: vehicle
          ? {
              create: {
                plateNumber: vehicle.plateNumber || null,
                brand: vehicle.brand || null,
                model: vehicle.model || null,
                year: vehicle.year ? Number(vehicle.year) : null,
                notes: vehicle.notes || null,
              },
            }
          : undefined,
      },
      include: { vehicles: true },
    });

    return new Response(JSON.stringify({ customer }), { status: 201 });
  } catch (e: any) {
    const message = e?.code === "P2002" ? "Email sudah terdaftar" : e?.message || "CRM error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";

type AuthPayload = { id: string; role: string };

const ALLOWED_UPDATE_TYPES = ["BEFORE", "PROGRESS", "AFTER"] as const;
const ALLOWED_MEDIA_TYPES = ["IMAGE", "VIDEO"] as const;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Service live update error";

async function requireOneOfPermissions(user: AuthPayload, permissions: string[]) {
  let lastError: unknown = null;
  for (const permission of permissions) {
    try {
      await requirePermission(user, permission);
      return;
    } catch (error: unknown) {
      lastError = error;
    }
  }
  throw lastError || new Error("Forbidden");
}

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as AuthPayload | null;
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    await requireOneOfPermissions(payload, ["orders_view", "crm_view", "mechanic_notes_view"]);

    const { searchParams } = new URL(req.url);
    const serviceOrderId = searchParams.get("serviceOrderId");
    const customerId = searchParams.get("customerId");

    const conditions: Prisma.Sql[] = [];
    if (serviceOrderId) conditions.push(Prisma.sql`slu.serviceOrderId = ${serviceOrderId}`);
    if (customerId) conditions.push(Prisma.sql`so.customerId = ${customerId}`);
    const whereClause = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}`
      : Prisma.empty;

    const updates = await prisma.$queryRaw<
      Array<{
        id: string;
        serviceOrderId: string;
        orderNumber: string;
        customerName: string;
        updateType: string;
        mediaType: string | null;
        mediaUrl: string | null;
        caption: string | null;
        directNote: string | null;
        createdAt: Date;
        mechanicName: string | null;
        mechanicEmail: string;
      }>
    >(Prisma.sql`
      SELECT
        slu.id,
        slu.serviceOrderId,
        so.orderNumber,
        so.customerName,
        slu.updateType,
        slu.mediaType,
        slu.mediaUrl,
        slu.caption,
        slu.directNote,
        slu.createdAt,
        u.name AS mechanicName,
        u.email AS mechanicEmail
      FROM ServiceLiveUpdate slu
      JOIN ServiceOrder so ON so.id = slu.serviceOrderId
      JOIN User u ON u.id = slu.createdById
      ${whereClause}
      ORDER BY slu.createdAt DESC
      LIMIT 100
    `);

    return new Response(JSON.stringify({ updates }), { status: 200 });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as AuthPayload | null;
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    await requirePermission(payload, "mechanic_notes_create");

    const body = await req.json();
    const serviceOrderId =
      typeof body?.serviceOrderId === "string" ? body.serviceOrderId.trim() : "";
    const updateType = typeof body?.updateType === "string" ? body.updateType.trim() : "";
    const mediaType = typeof body?.mediaType === "string" ? body.mediaType.trim() : "";
    const mediaUrl = typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : "";
    const caption = typeof body?.caption === "string" ? body.caption.trim() : "";
    const directNote = typeof body?.directNote === "string" ? body.directNote.trim() : "";

    if (!serviceOrderId || !updateType) {
      return new Response(
        JSON.stringify({ error: "serviceOrderId dan updateType wajib diisi" }),
        { status: 400 }
      );
    }
    if (!ALLOWED_UPDATE_TYPES.includes(updateType as (typeof ALLOWED_UPDATE_TYPES)[number])) {
      return new Response(JSON.stringify({ error: "updateType tidak valid" }), { status: 400 });
    }
    if (mediaType && !ALLOWED_MEDIA_TYPES.includes(mediaType as (typeof ALLOWED_MEDIA_TYPES)[number])) {
      return new Response(JSON.stringify({ error: "mediaType tidak valid" }), { status: 400 });
    }
    if (!directNote && !mediaUrl) {
      return new Response(
        JSON.stringify({ error: "Isi directNote atau mediaUrl minimal salah satu" }),
        { status: 400 }
      );
    }

    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: { id: true, orderNumber: true, customerName: true },
    });
    if (!serviceOrder) {
      return new Response(JSON.stringify({ error: "Order servis tidak ditemukan" }), { status: 404 });
    }

    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO ServiceLiveUpdate
        (id, serviceOrderId, updateType, mediaType, mediaUrl, caption, directNote, createdById)
      VALUES
        (${id}, ${serviceOrderId}, ${updateType}, ${mediaType || null}, ${mediaUrl || null}, ${caption || null}, ${directNote || null}, ${payload.id})
    `;

    const [created] = await prisma.$queryRaw<
      Array<{
        id: string;
        serviceOrderId: string;
        orderNumber: string;
        customerName: string;
        updateType: string;
        mediaType: string | null;
        mediaUrl: string | null;
        caption: string | null;
        directNote: string | null;
        createdAt: Date;
        mechanicName: string | null;
        mechanicEmail: string;
      }>
    >(Prisma.sql`
      SELECT
        slu.id,
        slu.serviceOrderId,
        so.orderNumber,
        so.customerName,
        slu.updateType,
        slu.mediaType,
        slu.mediaUrl,
        slu.caption,
        slu.directNote,
        slu.createdAt,
        u.name AS mechanicName,
        u.email AS mechanicEmail
      FROM ServiceLiveUpdate slu
      JOIN ServiceOrder so ON so.id = slu.serviceOrderId
      JOIN User u ON u.id = slu.createdById
      WHERE slu.id = ${id}
      LIMIT 1
    `);

    return new Response(JSON.stringify({ ok: true, update: created }), { status: 201 });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), { status: 500 });
  }
}

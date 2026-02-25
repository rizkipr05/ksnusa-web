import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";

const ALLOWED_PART_TYPES = ["ORIGINAL", "AFTERMARKET", "MIXED", "UNKNOWN"] as const;
type AuthPayload = { id: string; role: string };
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Notes error");

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as AuthPayload | null;
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    await requirePermission(payload, "mechanic_notes_view");

    const { searchParams } = new URL(req.url);
    const serviceOrderId = searchParams.get("serviceOrderId");
    const where: { serviceOrderId?: string } = {};
    if (serviceOrderId) where.serviceOrderId = serviceOrderId;
    
    const notes = await prisma.mechanicNote.findMany({
      where, 
      orderBy: { createdAt: 'desc' }, 
      include: { 
        createdBy: { select: { id: true, name: true, email: true } },
        serviceOrder: true
      }
    });
    const ids = notes.map((note) => note.id);
    let behaviorMap = new Map<string, { partType: string | null; partsUsed: string | null }>();
    if (ids.length) {
      const behaviorRows = await prisma.$queryRaw<Array<{ id: string; partType: string | null; partsUsed: string | null }>>(
        Prisma.sql`SELECT id, partType, partsUsed FROM MechanicNote WHERE id IN (${Prisma.join(ids)})`
      );
      behaviorMap = new Map(behaviorRows.map((row) => [row.id, { partType: row.partType, partsUsed: row.partsUsed }]));
    }

    const normalizedNotes = notes.map((note) => ({
      ...note,
      partType: behaviorMap.get(note.id)?.partType ?? null,
      partsUsed: behaviorMap.get(note.id)?.partsUsed ?? null,
    }));

    return new Response(JSON.stringify({ notes: normalizedNotes }), { status: 200 });
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

    const { serviceOrderId, content, partType, partsUsed } = await req.json();
    if (!serviceOrderId || !content) return new Response(JSON.stringify({ error: "serviceOrderId dan content wajib" }), { status: 400 });

    if (partType && !ALLOWED_PART_TYPES.includes(partType)) {
      return new Response(JSON.stringify({ error: "partType tidak valid" }), { status: 400 });
    }

    const normalizedPartsUsed =
      typeof partsUsed === "string" && partsUsed.trim().length > 0 ? partsUsed.trim() : null;

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

    if (partType || normalizedPartsUsed) {
      await prisma.$executeRaw`
        UPDATE MechanicNote
        SET partType = ${partType || null}, partsUsed = ${normalizedPartsUsed}
        WHERE id = ${note.id}
      `;
    }

    const noteWithBehavior = { ...note, partType: partType || null, partsUsed: normalizedPartsUsed };
    return new Response(JSON.stringify({ ok: true, note: noteWithBehavior }), { status: 201 });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), { status: 500 });
  }
}

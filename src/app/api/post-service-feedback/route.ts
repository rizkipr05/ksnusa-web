import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";

type AuthPayload = { id: string; role: string };

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Post-service feedback error";

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
    await requireOneOfPermissions(payload, ["crm_view", "orders_view", "mechanic_notes_view"]);

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");

    const conditions: Prisma.Sql[] = [];
    if (customerId) conditions.push(Prisma.sql`f.customerId = ${customerId}`);
    if (status && status !== "ALL") conditions.push(Prisma.sql`f.status = ${status}`);
    const whereClause = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}`
      : Prisma.empty;

    const feedbacks = await prisma.$queryRaw<
      Array<{
        id: string;
        customerId: string;
        serviceOrderId: string | null;
        orderNumber: string | null;
        question: string;
        answer: string | null;
        status: string;
        askedAt: Date;
        answeredAt: Date | null;
        answeredByName: string | null;
        answeredByEmail: string | null;
      }>
    >(Prisma.sql`
      SELECT
        f.id,
        f.customerId,
        f.serviceOrderId,
        so.orderNumber,
        f.question,
        f.answer,
        f.status,
        f.askedAt,
        f.answeredAt,
        u.name AS answeredByName,
        u.email AS answeredByEmail
      FROM PostServiceFeedback f
      LEFT JOIN ServiceOrder so ON so.id = f.serviceOrderId
      LEFT JOIN User u ON u.id = f.answeredById
      ${whereClause}
      ORDER BY f.askedAt DESC
      LIMIT 100
    `);

    return new Response(JSON.stringify({ feedbacks }), { status: 200 });
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
    await requireOneOfPermissions(payload, ["crm_view", "crm_manage"]);

    const body = await req.json();
    const customerId = typeof body?.customerId === "string" ? body.customerId.trim() : "";
    const serviceOrderId =
      typeof body?.serviceOrderId === "string" ? body.serviceOrderId.trim() : null;
    const question = typeof body?.question === "string" ? body.question.trim() : "";

    if (!customerId || !question) {
      return new Response(
        JSON.stringify({ error: "customerId dan question wajib diisi" }),
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!customer) {
      return new Response(JSON.stringify({ error: "Customer tidak ditemukan" }), { status: 404 });
    }

    if (serviceOrderId) {
      const serviceOrder = await prisma.serviceOrder.findUnique({
        where: { id: serviceOrderId },
        select: { id: true, customerId: true, status: true },
      });
      if (!serviceOrder || serviceOrder.customerId !== customerId) {
        return new Response(
          JSON.stringify({ error: "Service order tidak sesuai dengan customer" }),
          { status: 400 }
        );
      }
    }

    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO PostServiceFeedback (id, customerId, serviceOrderId, question, status, askedAt, createdAt, updatedAt)
      VALUES (${id}, ${customerId}, ${serviceOrderId}, ${question}, 'OPEN', NOW(3), NOW(3), NOW(3))
    `;

    return new Response(JSON.stringify({ ok: true, id }), { status: 201 });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), { status: 500 });
  }
}

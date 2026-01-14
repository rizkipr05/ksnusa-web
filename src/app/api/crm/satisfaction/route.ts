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
    const rating = searchParams.get("rating");

    const where: any = {};
    if (rating && rating !== "ALL") where.rating = Number(rating);

    const surveys = await prisma.satisfactionSurvey.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: true, serviceOrder: true },
    });

    return new Response(JSON.stringify({ result: surveys }), { status: 200 });
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
    const { customerId, serviceOrderId, rating, feedback, channel } = body || {};
    if (!customerId || !rating) {
      return new Response(JSON.stringify({ error: "Customer dan rating wajib diisi" }), { status: 400 });
    }

    const survey = await prisma.satisfactionSurvey.create({
      data: {
        customerId,
        serviceOrderId: serviceOrderId || null,
        rating: Number(rating),
        feedback: feedback || null,
        channel: channel || null,
      },
    });

    return new Response(JSON.stringify({ survey }), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "CRM error" }), { status: 500 });
  }
}

import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as AuthPayload | null;
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    await requireOneOfPermissions(payload, ["crm_manage", "mechanic_notes_create"]);

    const body = await req.json();
    const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
    const status = typeof body?.status === "string" ? body.status.trim() : "";

    if (!answer && !status) {
      return new Response(
        JSON.stringify({ error: "answer atau status wajib diisi" }),
        { status: 400 }
      );
    }

    const allowedStatus = ["OPEN", "ANSWERED", "CLOSED"];
    if (status && !allowedStatus.includes(status)) {
      return new Response(JSON.stringify({ error: "status tidak valid" }), { status: 400 });
    }

    const existing = await prisma.$queryRaw<Array<{ id: string; status: string }>>`
      SELECT id, status FROM PostServiceFeedback WHERE id = ${params.id} LIMIT 1
    `;
    if (!existing.length) {
      return new Response(JSON.stringify({ error: "Feedback tidak ditemukan" }), { status: 404 });
    }

    if (answer) {
      await prisma.$executeRaw`
        UPDATE PostServiceFeedback
        SET answer = ${answer},
            status = 'ANSWERED',
            answeredAt = NOW(3),
            answeredById = ${payload.id},
            updatedAt = NOW(3)
        WHERE id = ${params.id}
      `;
    } else if (status) {
      await prisma.$executeRaw`
        UPDATE PostServiceFeedback
        SET status = ${status},
            updatedAt = NOW(3)
        WHERE id = ${params.id}
      `;
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), { status: 500 });
  }
}

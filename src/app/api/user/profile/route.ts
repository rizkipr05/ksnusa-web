import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { getBearerTokenFromRequest, getJwtPayload, hashPassword, verifyPassword } from "@/lib/auth";

async function getToken(req: Request) {
  const bearer = getBearerTokenFromRequest(req);
  if (bearer) return bearer;
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value || null;
}

export async function GET(req: Request) {
  try {
    const token = await getToken(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    if (!payload?.id) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Session expired, login ulang" }), { status: 401 });
    }
    return new Response(JSON.stringify({ user }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Profile error" }), { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const token = await getToken(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as any;
    if (!payload?.id) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const body = await req.json();
    const { name, currentPassword, newPassword } = body || {};

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return new Response(JSON.stringify({ error: "Session expired, login ulang" }), { status: 401 });
    }

    let passwordUpdate = {};
    if (newPassword) {
      if (!currentPassword) {
        return new Response(JSON.stringify({ error: "Password saat ini wajib diisi" }), { status: 400 });
      }
      const ok = await verifyPassword(currentPassword, user.password);
      if (!ok) {
        return new Response(JSON.stringify({ error: "Password saat ini salah" }), { status: 401 });
      }
      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "Password baru minimal 6 karakter" }), { status: 400 });
      }
      const hashed = await hashPassword(newPassword);
      passwordUpdate = { password: hashed };
    }

    const updated = await prisma.user.update({
      where: { id: payload.id },
      data: {
        name: name ?? user.name,
        ...passwordUpdate,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return new Response(JSON.stringify({ user: updated }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Profile error" }), { status: 500 });
  }
}

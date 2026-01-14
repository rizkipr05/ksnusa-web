// API untuk mengelola permissions
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requireRole } from "@/lib/server-auth";

/**
 * GET /api/admin/permissions
 * Get all permissions atau permissions by role
 */
export async function GET(request: NextRequest) {
  try {
    const token = getBearerTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = getJwtPayload(token);
    requireRole(payload, ['OWNER', 'ADMIN']);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (role) {
      // Get permissions by role
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { role },
        include: {
          permission: true
        }
      });
      
      return NextResponse.json({
        role,
        permissions: rolePermissions.map(rp => rp.permission)
      });
    } else {
      // Get all permissions
      const permissions = await prisma.permission.findMany({
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' }
        ]
      });
      
      return NextResponse.json({ permissions });
    }
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/permissions
 * Assign permission ke role
 * Body: { role: string, permissionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const token = getBearerTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = getJwtPayload(token);
    requireRole(payload, ['OWNER']); // Hanya OWNER yang bisa assign permissions

    const { role, permissionId } = await request.json();

    if (!role || !permissionId) {
      return NextResponse.json(
        { error: "role dan permissionId harus diisi" },
        { status: 400 }
      );
    }

    // Check apakah permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId }
    });

    if (!permission) {
      return NextResponse.json(
        { error: "Permission tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check apakah sudah ada
    const existing = await prisma.rolePermission.findFirst({
      where: {
        role,
        permissionId
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Permission sudah ada untuk role ini" },
        { status: 400 }
      );
    }

    // Create role permission
    const rolePermission = await prisma.rolePermission.create({
      data: {
        role,
        permissionId
      },
      include: {
        permission: true
      }
    });

    return NextResponse.json({
      message: "Permission berhasil ditambahkan",
      rolePermission
    });
  } catch (error: any) {
    console.error('Error creating role permission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/permissions?role=ADMIN&permissionId=xxx
 * Revoke permission dari role
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = getBearerTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = getJwtPayload(token);
    requireRole(payload, ['OWNER']); // Hanya OWNER yang bisa revoke permissions

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const permissionId = searchParams.get('permissionId');

    if (!role || !permissionId) {
      return NextResponse.json(
        { error: "role dan permissionId harus diisi" },
        { status: 400 }
      );
    }

    // Delete role permission
    const deleted = await prisma.rolePermission.deleteMany({
      where: {
        role,
        permissionId
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Role permission tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Permission berhasil dihapus dari role"
    });
  } catch (error: any) {
    console.error('Error deleting role permission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

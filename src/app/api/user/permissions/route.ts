// API untuk get user permissions
import { NextRequest, NextResponse } from "next/server";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { getPermissionsByRole } from "@/lib/server-auth";

/**
 * GET /api/user/permissions
 * Get permissions untuk current user berdasarkan role-nya
 */
export async function GET(request: NextRequest) {
  try {
    const token = getBearerTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = getJwtPayload(token);
    if (!payload || !payload.role) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const permissions = await getPermissionsByRole(payload.role);

    // Format permissions as a simple object for easy checking
    const permissionMap = permissions.reduce((acc, perm) => {
      acc[perm.name] = true;
      // Also create resource.action format
      acc[`${perm.resource}.${perm.action}`] = true;
      return acc;
    }, {} as { [key: string]: boolean });

    return NextResponse.json({
      role: payload.role,
      permissions: permissionMap,
      permissionsList: permissions
    });
  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

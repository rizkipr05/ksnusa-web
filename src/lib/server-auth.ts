// Helper untuk mendapatkan user dari cookie/header di server action
import { cookies } from "next/headers";
import { getJwtPayload } from "./auth";
import { prisma } from "./db";

export async function getCurrentUserFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = getJwtPayload(token);
  return payload as { id: string; email: string; role: string } | null;
}

export function requireRole(user: any, allowedRoles: string[]) {
  if (!user) throw new Error("Unauthorized: user not logged in");
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: role ${user.role} tidak diizinkan`);
  }
}

/**
 * Check apakah user punya permission tertentu
 * @param user - User dari getCurrentUserFromCookie()
 * @param permissionName - Nama permission (e.g., "inventory_create")
 */
export async function requirePermission(user: any, permissionName: string) {
  if (!user) throw new Error("Unauthorized: user not logged in");

  // Cek apakah role user punya permission ini
  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      role: user.role,
      permission: {
        name: permissionName,
      },
    },
    include: {
      permission: true,
    },
  });

  if (!rolePermission) {
    throw new Error(
      `Forbidden: ${user.role} tidak punya akses ke ${permissionName}`
    );
  }

  return rolePermission;
}

/**
 * Check apakah user punya akses ke resource tertentu
 * @param user - User dari getCurrentUserFromCookie()
 * @param resource - Resource name (e.g., "inventory", "suppliers")
 * @param action - Action (e.g., "view", "create", "edit", "delete")
 */
export async function hasPermission(
  user: any,
  resource: string,
  action: string
): Promise<boolean> {
  if (!user) return false;

  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      role: user.role,
      permission: {
        resource: resource,
        action: action,
      },
    },
  });

  return !!rolePermission;
}

/**
 * Get all permissions untuk role tertentu
 * @param role - Role name (OWNER, ADMIN, MEKANIK)
 */
export async function getPermissionsByRole(role: string) {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role },
    include: {
      permission: true,
    },
  });

  return rolePermissions.map((rp) => rp.permission);
}

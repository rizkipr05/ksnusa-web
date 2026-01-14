// Custom hook untuk check permissions di client side
"use client";

import { useEffect, useState } from "react";

interface UserPermissions {
  [key: string]: boolean;
}

interface PermissionData {
  role: string;
  permissions: UserPermissions;
  permissionsList: any[];
}

export function usePermission() {
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/user/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data: PermissionData = await res.json();
        setPermissions(data.permissions);
        setRole(data.role);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Check apakah user punya permission tertentu
   * @param permissionName - Nama permission (e.g., "inventory_create")
   */
  const hasPermission = (permissionName: string): boolean => {
    return permissions[permissionName] === true;
  };

  /**
   * Check apakah user punya salah satu dari permissions yang diberikan
   * @param permissionNames - Array nama permissions
   */
  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(name => permissions[name] === true);
  };

  /**
   * Check apakah user punya semua permissions yang diberikan
   * @param permissionNames - Array nama permissions
   */
  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every(name => permissions[name] === true);
  };

  /**
   * Check apakah user adalah role tertentu
   * @param roles - Role atau array of roles
   */
  const isRole = (roles: string | string[]): boolean => {
    if (Array.isArray(roles)) {
      return roles.includes(role);
    }
    return role === roles;
  };

  return {
    permissions,
    role,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
    refresh: loadPermissions
  };
}

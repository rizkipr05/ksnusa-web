// Halaman Role Management - untuk OWNER mengelola permissions
"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PermissionGuard from "@/components/PermissionGuard";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

interface RolePermissions {
  [role: string]: {
    [permissionId: string]: boolean;
  };
}

export default function RoleManagementPage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({
    OWNER: {},
    ADMIN: {},
    MEKANIK: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as { [resource: string]: Permission[] });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Load all permissions
      const permRes = await fetch('/api/admin/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!permRes.ok) {
        throw new Error('Failed to load permissions');
      }

      const permData = await permRes.json();
      setPermissions(permData.permissions);

      // Load permissions for each role
      const roles = ['OWNER', 'ADMIN', 'MEKANIK'];
      const newRolePermissions: RolePermissions = {
        OWNER: {},
        ADMIN: {},
        MEKANIK: {}
      };

      for (const role of roles) {
        const roleRes = await fetch(`/api/admin/permissions?role=${role}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (roleRes.ok) {
          const roleData = await roleRes.json();
          roleData.permissions.forEach((perm: Permission) => {
            newRolePermissions[role][perm.id] = true;
          });
        }
      }

      setRolePermissions(newRolePermissions);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Gagal memuat data permissions');
    } finally {
      setLoading(false);
    }
  }

  async function togglePermission(role: string, permissionId: string, currentValue: boolean) {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      if (currentValue) {
        // Revoke permission
        const res = await fetch(`/api/admin/permissions?role=${role}&permissionId=${permissionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to revoke permission');
      } else {
        // Grant permission
        const res = await fetch('/api/admin/permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role, permissionId })
        });

        if (!res.ok) throw new Error('Failed to grant permission');
      }

      // Update local state
      setRolePermissions(prev => ({
        ...prev,
        [role]: {
          ...prev[role],
          [permissionId]: !currentValue
        }
      }));
    } catch (error) {
      console.error('Error toggling permission:', error);
      alert('Gagal mengubah permission');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Role & Permission Management</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <PermissionGuard requiredPermission="role_management">
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Role & Permission Management</h1>
        <p className="text-gray-600">Kelola akses setiap role ke fitur-fitur sistem</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                  Permission
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OWNER
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ADMIN
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MEKANIK
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(permissionsByResource).map(([resource, perms]) => (
                <React.Fragment key={`resource-${resource}`}>
                  <tr key={`header-${resource}`} className="bg-blue-50">
                    <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-blue-900 uppercase">
                      {resource}
                    </td>
                  </tr>
                  {perms.map((perm) => (
                    <tr key={perm.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm sticky left-0 bg-white">
                        <div className="font-medium text-gray-900">{perm.action}</div>
                        <div className="text-gray-500 text-xs">{perm.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={rolePermissions.OWNER[perm.id] || false}
                          onChange={() => togglePermission('OWNER', perm.id, rolePermissions.OWNER[perm.id])}
                          disabled={saving}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={rolePermissions.ADMIN[perm.id] || false}
                          onChange={() => togglePermission('ADMIN', perm.id, rolePermissions.ADMIN[perm.id])}
                          disabled={saving}
                          className="h-4 w-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={rolePermissions.MEKANIK[perm.id] || false}
                          onChange={() => togglePermission('MEKANIK', perm.id, rolePermissions.MEKANIK[perm.id])}
                          disabled={saving}
                          className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
          Menyimpan...
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}

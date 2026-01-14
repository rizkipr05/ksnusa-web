"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string; // e.g., "inventory_view"
  fallback?: React.ReactNode; // Optional fallback UI
}

/**
 * Component untuk protect halaman berdasarkan permission
 * Jika user tidak punya permission, redirect ke dashboard
 */
export default function PermissionGuard({ children, requiredPermission, fallback }: PermissionGuardProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [requiredPermission]);

  async function checkPermission() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/user/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      const hasPermission = data.permissions[requiredPermission] === true;

      if (!hasPermission) {
        setHasAccess(false);
        setLoading(false);
        // Redirect ke dashboard setelah 2 detik
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setHasAccess(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

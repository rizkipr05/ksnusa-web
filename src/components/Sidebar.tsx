// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  Settings,
  LogOut,
  CheckSquare,
  Wrench,
  Shield,
  FileText,
  Users,
  MessageSquare,
  Bell,
  PieChart,
  Star,
  Smile,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserPermissions {
  [key: string]: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<UserPermissions>({});
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
        const data = await res.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  }

  // Handler untuk logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Check if user has permission
  const hasPermission = (permissionName: string) => {
    return permissions[permissionName] === true;
  };

  // Daftar Menu Navigasi dengan permission checking
  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
      permission: "dashboard_view"
    },
    {
      label: "Inventory",
      icon: Package,
      href: "/inventory",
      active: pathname === "/inventory",
      permission: "inventory_view"
    },
    {
      label: "Suppliers",
      icon: Truck,
      href: "/suppliers",
      active: pathname === "/suppliers",
      permission: "suppliers_view"
    },
    {
      label: "Orders",
      icon: ShoppingCart,
      href: "/orders",
      active: pathname === "/orders",
      permission: "orders_view"
    },
    {
      label: "Service Orders",
      icon: Wrench,
      href: "/service-orders",
      active: pathname === "/service-orders",
      permission: "orders_view"
    },

    {
      label: "Approvals",
      icon: CheckSquare,
      href: "/approvals",
      active: pathname === "/approvals",
      permission: "approvals_view"
    },
    {
      label: "Mechanic Notes",
      icon: FileText,
      href: "/mechanic-notes",
      active: pathname === "/mechanic-notes",
      permission: "mechanic_notes_view"
    },
    {
      label: "CRM",
      icon: Users,
      href: "/crm/customers",
      active: pathname?.startsWith("/crm"),
      permission: "crm_view"
    },
    {
      label: "Komplain",
      icon: MessageSquare,
      href: "/crm/complaints",
      active: pathname === "/crm/complaints",
      permission: "crm_view"
    },
    {
      label: "Follow Up",
      icon: Bell,
      href: "/crm/follow-ups",
      active: pathname === "/crm/follow-ups",
      permission: "crm_view"
    },
    {
      label: "Segmentasi",
      icon: PieChart,
      href: "/crm/segmentation",
      active: pathname === "/crm/segmentation",
      permission: "crm_view"
    },
    {
      label: "Loyalty",
      icon: Star,
      href: "/crm/loyalty",
      active: pathname === "/crm/loyalty",
      permission: "crm_view"
    },
    {
      label: "Kepuasan",
      icon: Smile,
      href: "/crm/satisfaction",
      active: pathname === "/crm/satisfaction",
      permission: "crm_view"
    },
    {
      label: "Komunikasi",
      icon: MessageCircle,
      href: "/crm/communications",
      active: pathname === "/crm/communications",
      permission: "crm_view"
    },
    {
      label: "Role Management",
      icon: Shield,
      href: "/role-management",
      active: pathname === "/role-management",
      permission: "role_management"
    },
  ];

  // Filter routes berdasarkan permission
  const visibleRoutes = routes.filter(route => hasPermission(route.permission));

  if (loading) {
    return (
      <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
        <div className="px-3 py-2">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4">
             <div className="bg-blue-600 w-full h-full rounded-lg flex items-center justify-center font-bold">
               KS
             </div>
          </div>
          <h1 className="text-xl font-bold">
            KSNUSA
          </h1>
        </Link>
        
        <div className="space-y-1">
          {visibleRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                route.active ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.active ? "text-blue-500" : "text-zinc-400")} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Tombol Settings & Logout di Bawah */}
      <div className="px-3 py-2 space-y-1">
         {hasPermission("settings_view") && (
           <Link
              href="/settings"
              className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
            >
              <div className="flex items-center flex-1">
                <Settings className="h-5 w-5 mr-3 text-zinc-400" />
                Settings
              </div>
            </Link>
         )}
          
          {/* Tombol Logout */}
          <button
            onClick={handleLogout}
            className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-red-500/20 rounded-lg transition text-zinc-400 hover:text-red-400"
          >
            <div className="flex items-center flex-1">
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </div>
          </button>
      </div>
    </div>
  );
}

import { getInventoryAnalytics } from "@/lib/olap-engine";
import { prisma } from "@/lib/db";
import InventoryClient from "@/app/inventory/inventory-client"; // Path Absolute biar aman
import PermissionGuard from "@/components/PermissionGuard";

export default async function InventoryPage() {
  const data = await getInventoryAnalytics();
  const suppliers = await prisma.supplier.findMany();
  
  return (
    <PermissionGuard requiredPermission="inventory_view">
      <InventoryClient initialData={data} suppliers={suppliers} />
    </PermissionGuard>
  );
}
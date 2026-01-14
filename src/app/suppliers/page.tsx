import { getSupplierAnalytics } from "@/lib/olap-engine";
import SuppliersClient from "./suppliers-client";
import PermissionGuard from "@/components/PermissionGuard";

export default async function SuppliersPage() {
  // Ambil data hasil kalkulasi Supplier dari Database
  const supplierData = await getSupplierAnalytics();

  return (
    <PermissionGuard requiredPermission="suppliers_view">
      <SuppliersClient data={supplierData} />
    </PermissionGuard>
  );
}
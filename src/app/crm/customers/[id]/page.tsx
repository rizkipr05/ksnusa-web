"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import PermissionGuard from "@/components/PermissionGuard";

type ServiceOrder = {
  id: string;
  orderNumber: string;
  serviceType: string;
  status: string;
  scheduledDate: string;
  totalCost?: number | null;
};

type Vehicle = {
  id: string;
  plateNumber?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
};

type CustomerDetail = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  preferredService?: string | null;
  customerType?: string | null;
  notes?: string | null;
  vehicles: Vehicle[];
  serviceOrders: ServiceOrder[];
};

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/crm/customers/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Gagal memuat detail pelanggan");
        setCustomer(data.customer);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link className="text-sm text-blue-600 hover:underline" href="/crm/customers">
              ← Kembali ke daftar pelanggan
            </Link>
            <h1 className="text-2xl font-semibold mt-2">Profil Pelanggan</h1>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-500">Memuat detail...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && customer && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="bg-white border rounded p-4 space-y-3">
              <div className="text-lg font-semibold">{customer.name}</div>
              <div className="text-sm text-gray-600">{customer.preferredService || "-"}</div>
              <div className="text-sm">
                <div>Email: {customer.email || "-"}</div>
                <div>HP: {customer.phone || "-"}</div>
                <div>Alamat: {customer.address || "-"}</div>
                <div>Tipe: {customer.customerType || "-"}</div>
              </div>
              {customer.notes && (
                <div className="text-sm text-gray-600">Catatan: {customer.notes}</div>
              )}

              <div>
                <div className="text-sm font-medium mb-2">Kendaraan</div>
                {customer.vehicles.length ? (
                  <div className="space-y-2">
                    {customer.vehicles.map((v) => (
                      <div key={v.id} className="border rounded p-2 text-sm">
                        <div>{`${v.brand || "-"} ${v.model || ""}`.trim()}</div>
                        <div className="text-xs text-gray-500">
                          {v.plateNumber || "-"} • {v.year || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Belum ada kendaraan.</div>
                )}
              </div>
            </div>

            <div className="bg-white border rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold">Riwayat Servis Terakhir</h2>
                  <p className="text-xs text-gray-500">10 servis terakhir untuk pelanggan ini.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left">Order</th>
                      <th className="p-2 border text-left">Layanan</th>
                      <th className="p-2 border text-left">Status</th>
                      <th className="p-2 border text-right">Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.serviceOrders.length ? (
                      customer.serviceOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="p-2 border">{order.orderNumber}</td>
                          <td className="p-2 border">{order.serviceType}</td>
                          <td className="p-2 border">{order.status}</td>
                          <td className="p-2 border text-right">
                            {order.totalCost ? order.totalCost.toLocaleString("id-ID") : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-3 border text-center text-gray-500" colSpan={4}>
                          Belum ada riwayat servis.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

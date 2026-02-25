"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PermissionGuard from "@/components/PermissionGuard";

type CatalogItem = {
  serviceOrderId: string;
  orderNumber: string;
  serviceType: string;
  status: string;
  scheduledDate: string;
  completedDate: string | null;
  totalCost: number | null;
  ownerId: string | null;
  ownerName: string;
  plateNumber: string | null;
  vehicleType: string | null;
  vehicleInfo: string | null;
  transparency: {
    liveCount: number;
    lastLiveUpdateAt: string | null;
    lastDirectNote: string | null;
  };
  behaviorTracking: {
    serviceCount: number;
    productPreference: string;
  };
  postServiceCare: {
    nextServiceDate: string | null;
    daysRemaining: number | null;
    openFeedbackCount: number;
  };
};

export default function ServiceCatalogPage() {
  const [serviceId, setServiceId] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeFilters = useMemo(
    () => [serviceId, plateNumber, vehicleType, ownerName].filter((v) => v.trim().length > 0).length,
    [serviceId, plateNumber, vehicleType, ownerName]
  );

  async function loadCatalog() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const params = new URLSearchParams();
      if (serviceId.trim()) params.set("serviceId", serviceId.trim());
      if (plateNumber.trim()) params.set("plateNumber", plateNumber.trim());
      if (vehicleType.trim()) params.set("vehicleType", vehicleType.trim());
      if (ownerName.trim()) params.set("ownerName", ownerName.trim());

      const query = params.toString();
      const res = await fetch(`/api/service-catalog${query ? `?${query}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal memuat service catalog");
      setItems(data.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    loadCatalog();
  }

  function resetFilters() {
    setServiceId("");
    setPlateNumber("");
    setVehicleType("");
    setOwnerName("");
  }

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Service Catalog</h1>
          <p className="text-sm text-gray-500">
            Pusat data servis: transparansi, behavior tracking, dan post-service care.
          </p>
        </div>

        <form onSubmit={onSearch} className="border rounded bg-white p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="Service ID / Order Number"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="Plat Nomor"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="Jenis Kendaraan"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="Nama Pemilik"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Mencari..." : "Cari"}
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded border text-sm hover:bg-gray-50"
              onClick={resetFilters}
              disabled={loading}
            >
              Reset
            </button>
            <span className="text-xs text-gray-500">
              {activeFilters} filter aktif
            </span>
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </form>

        <div className="space-y-3">
          {items.length === 0 && !loading ? (
            <div className="border rounded bg-white p-6 text-sm text-gray-500">
              Tidak ada data servis yang cocok dengan filter.
            </div>
          ) : null}

          {items.map((item) => (
            <div key={item.serviceOrderId} className="border rounded bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm text-gray-500">Order</div>
                  <div className="font-semibold">{item.orderNumber}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded border bg-gray-50">{item.status}</div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs">Nama Pemilik</div>
                  <div>{item.ownerName}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Plat Nomor</div>
                  <div>{item.plateNumber || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Jenis Kendaraan</div>
                  <div>{item.vehicleType || item.vehicleInfo || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Jenis Servis</div>
                  <div>{item.serviceType}</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 text-xs">
                <div className="border rounded p-3 bg-gray-50">
                  <div className="font-medium mb-1">Transparansi & Edukasi</div>
                  <div>Live status: {item.transparency.liveCount}</div>
                  <div>
                    Update terakhir:{" "}
                    {item.transparency.lastLiveUpdateAt
                      ? new Date(item.transparency.lastLiveUpdateAt).toLocaleString("id-ID")
                      : "-"}
                  </div>
                  <div className="line-clamp-2">
                    Direct note: {item.transparency.lastDirectNote || "-"}
                  </div>
                </div>

                <div className="border rounded p-3 bg-gray-50">
                  <div className="font-medium mb-1">Behavior Tracking</div>
                  <div>Total servis: {item.behaviorTracking.serviceCount}</div>
                  <div>Preferensi part: {item.behaviorTracking.productPreference}</div>
                </div>

                <div className="border rounded p-3 bg-gray-50">
                  <div className="font-medium mb-1">Post-Service Care</div>
                  <div>
                    Next service:{" "}
                    {item.postServiceCare.nextServiceDate
                      ? new Date(item.postServiceCare.nextServiceDate).toLocaleDateString("id-ID")
                      : "-"}
                  </div>
                  <div>Sisa hari: {item.postServiceCare.daysRemaining ?? "-"}</div>
                  <div>Feedback open: {item.postServiceCare.openFeedbackCount}</div>
                </div>
              </div>

              {item.ownerId ? (
                <div className="pt-1">
                  <Link
                    className="text-sm text-blue-600 hover:underline"
                    href={`/crm/customers/${item.ownerId}`}
                  >
                    Buka detail customer
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </PermissionGuard>
  );
}

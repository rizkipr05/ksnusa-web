"use client";
import React, { useEffect, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";

type Segment = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  serviceCount: number;
  revenue: number;
  lastServiceAt: string | null;
  frequency: string;
  valueTier: string;
  vehicleBrands: string[];
  preferredService?: string | null;
};

type Summary = {
  totalCustomers: number;
  byFrequency: Record<string, number>;
  byValue: Record<string, number>;
  topBrands: Array<{ brand: string; total: number }>;
};

type Highlight = {
  id: string;
  name: string;
  revenue: number;
  serviceCount: number;
  lastServiceAt: string | null;
};

type SegmentationData = {
  segments: Segment[];
  summary: Summary;
  highlights: {
    topRevenue: Highlight[];
    topActivity: Highlight[];
    inactive: Highlight[];
  };
  recommendations: Array<{ title: string; detail: string; level: string }>;
};

export default function SegmentationPage() {
  const [data, setData] = useState<SegmentationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/crm/segmentation", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Segmentasi & Rekomendasi CRM</h1>
          <p className="text-sm text-gray-500">
            Segmentasi pelanggan berdasarkan nilai, frekuensi, dan kendaraan untuk strategi layanan.
          </p>
        </div>

        {loading && <div className="text-sm text-gray-500">Memuat segmentasi...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && data && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-white border rounded p-4">
                <div className="text-xs uppercase text-gray-500">Total Pelanggan</div>
                <div className="text-2xl font-semibold">{data.summary.totalCustomers}</div>
              </div>
              <div className="bg-white border rounded p-4">
                <div className="text-xs uppercase text-gray-500">Loyal</div>
                <div className="text-2xl font-semibold">{data.summary.byFrequency.Loyal || 0}</div>
              </div>
              <div className="bg-white border rounded p-4">
                <div className="text-xs uppercase text-gray-500">Repeat</div>
                <div className="text-2xl font-semibold">{data.summary.byFrequency.Repeat || 0}</div>
              </div>
              <div className="bg-white border rounded p-4">
                <div className="text-xs uppercase text-gray-500">New</div>
                <div className="text-2xl font-semibold">{data.summary.byFrequency.New || 0}</div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white border rounded p-4">
                <h2 className="font-semibold mb-2">Brand Kendaraan Terbanyak</h2>
                <div className="space-y-2">
                  {data.summary.topBrands.length ? (
                    data.summary.topBrands.map((b) => (
                      <div key={b.brand} className="flex items-center justify-between text-sm">
                        <span>{b.brand}</span>
                        <span className="font-medium">{b.total}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Belum ada data kendaraan.</div>
                  )}
                </div>
              </div>

              <div className="bg-white border rounded p-4">
                <h2 className="font-semibold mb-2">Tier Nilai Pelanggan</h2>
                <div className="space-y-2 text-sm">
                  {Object.entries(data.summary.byValue).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between">
                      <span>{tier}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="bg-white border rounded p-4">
                <h2 className="font-semibold mb-2">Top Revenue</h2>
                <ul className="space-y-2 text-sm">
                  {data.highlights.topRevenue.map((c) => (
                    <li key={c.id} className="flex items-center justify-between">
                      <span>{c.name}</span>
                      <span>Rp {c.revenue.toLocaleString("id-ID")}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border rounded p-4">
                <h2 className="font-semibold mb-2">Paling Aktif</h2>
                <ul className="space-y-2 text-sm">
                  {data.highlights.topActivity.map((c) => (
                    <li key={c.id} className="flex items-center justify-between">
                      <span>{c.name}</span>
                      <span>{c.serviceCount} servis</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border rounded p-4">
                <h2 className="font-semibold mb-2">Pelanggan Pasif</h2>
                <ul className="space-y-2 text-sm">
                  {data.highlights.inactive.map((c) => (
                    <li key={c.id} className="flex items-center justify-between">
                      <span>{c.name}</span>
                      <span className="text-gray-500">
                        {c.lastServiceAt ? new Date(c.lastServiceAt).toLocaleDateString("id-ID") : "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white border rounded p-4">
              <h2 className="font-semibold mb-3">Insight & Rekomendasi</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {data.recommendations.map((r) => (
                  <div key={r.title} className="border rounded p-3 text-sm">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-gray-600 mt-1">{r.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border rounded p-4">
              <h2 className="font-semibold mb-3">Daftar Segmentasi Pelanggan</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left">Nama</th>
                      <th className="p-2 border text-left">Segment</th>
                      <th className="p-2 border text-left">Value</th>
                      <th className="p-2 border text-right">Servis</th>
                      <th className="p-2 border text-right">Revenue</th>
                      <th className="p-2 border text-left">Kendaraan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.segments.map((c) => (
                      <tr key={c.id}>
                        <td className="p-2 border">{c.name}</td>
                        <td className="p-2 border">{c.frequency}</td>
                        <td className="p-2 border">{c.valueTier}</td>
                        <td className="p-2 border text-right">{c.serviceCount}</td>
                        <td className="p-2 border text-right">
                          Rp {c.revenue.toLocaleString("id-ID")}
                        </td>
                        <td className="p-2 border text-xs text-gray-600">
                          {c.vehicleBrands.length ? c.vehicleBrands.join(", ") : "-"}
                        </td>
                      </tr>
                    ))}
                    {!data.segments.length && (
                      <tr>
                        <td colSpan={6} className="p-4 border text-center text-gray-500">
                          Belum ada data segmentasi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </PermissionGuard>
  );
}

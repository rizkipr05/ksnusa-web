"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";

type Vehicle = {
  id: string;
  plateNumber?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
};

type CustomerRow = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  preferredService?: string | null;
  vehicles: Vehicle[];
  serviceCount: number;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredService, setPreferredService] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const { hasPermission } = usePermission();

  const loadCustomers = async (q?: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = q ? `/api/crm/customers?q=${encodeURIComponent(q)}` : "/api/crm/customers";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal memuat pelanggan");
      setCustomers(data.result || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(query.trim());
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/crm/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          preferredService,
          vehicle: {
            plateNumber,
            brand,
            model,
            year,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal membuat pelanggan");
      setName("");
      setEmail("");
      setPhone("");
      setPreferredService("");
      setPlateNumber("");
      setBrand("");
      setModel("");
      setYear("");
      await loadCustomers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">CRM - Pelanggan</h1>
          <p className="text-sm text-gray-500">Profil pelanggan, kendaraan, dan riwayat servis.</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-white border rounded p-4 space-y-4">
            <form onSubmit={onSearch} className="flex items-center gap-2">
              <input
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder="Cari nama, email, atau nomor HP"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="px-3 py-2 text-sm bg-black text-white rounded">Cari</button>
            </form>

            {loading ? (
              <div className="text-sm text-gray-500">Memuat pelanggan...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left">Nama</th>
                      <th className="p-2 border text-left">Kontak</th>
                      <th className="p-2 border text-left">Kendaraan</th>
                      <th className="p-2 border text-center">Servis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td className="p-2 border">
                          <Link className="text-blue-600 hover:underline" href={`/crm/customers/${c.id}`}>
                            {c.name}
                          </Link>
                          <div className="text-xs text-gray-500">{c.preferredService || "-"}</div>
                        </td>
                        <td className="p-2 border">
                          <div>{c.email || "-"}</div>
                          <div className="text-xs text-gray-500">{c.phone || "-"}</div>
                        </td>
                        <td className="p-2 border text-xs text-gray-600">
                          {c.vehicles.length
                            ? c.vehicles.map((v) => `${v.brand || ""} ${v.model || ""} ${v.plateNumber || ""}`.trim()).join(", ")
                            : "-"}
                        </td>
                        <td className="p-2 border text-center">{c.serviceCount}</td>
                      </tr>
                    ))}
                    {!customers.length && (
                      <tr>
                        <td className="p-4 border text-center text-gray-500" colSpan={4}>
                          Belum ada pelanggan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Tambah Pelanggan</h2>
            {!hasPermission("crm_manage") && (
              <div className="text-xs text-gray-500">Perlu permission crm_manage untuk membuat data.</div>
            )}
            <form onSubmit={onCreate} className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Nama pelanggan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              />
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              />
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Nomor HP"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              />
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Preferensi layanan"
                value={preferredService}
                onChange={(e) => setPreferredService(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              />
              <div className="border rounded p-3 space-y-2">
                <div className="text-xs text-gray-500">Kendaraan utama</div>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Plat nomor"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  disabled={!hasPermission("crm_manage")}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="border rounded px-3 py-2 text-sm"
                    placeholder="Merek"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    disabled={!hasPermission("crm_manage")}
                  />
                  <input
                    className="border rounded px-3 py-2 text-sm"
                    placeholder="Model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={!hasPermission("crm_manage")}
                  />
                </div>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Tahun"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={!hasPermission("crm_manage")}
                />
              </div>
              <button
                className="w-full bg-black text-white rounded py-2 text-sm disabled:opacity-60"
                disabled={!hasPermission("crm_manage")}
              >
                Simpan
              </button>
            </form>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}

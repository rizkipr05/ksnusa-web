"use client";
import React, { useEffect, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";

type Complaint = {
  id: string;
  title: string;
  description: string;
  status: string;
  channel?: string | null;
  createdAt: string;
  customer: { id: string; name: string };
  serviceOrder?: { orderNumber: string } | null;
};

type CustomerOption = { id: string; name: string };

const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("");

  const { hasPermission } = usePermission();

  const loadComplaints = async (filters?: { status?: string; q?: string }) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "ALL") params.set("status", filters.status);
      if (filters?.q) params.set("q", filters.q);
      const res = await fetch(`/api/crm/complaints?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal memuat komplain");
      setComplaints(data.result || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/crm/customers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setCustomers(data.result || []);
    }
  };

  useEffect(() => {
    loadComplaints();
    loadCustomers();
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadComplaints({ status: statusFilter, q: query.trim() });
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/crm/complaints", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          title,
          description,
          channel,
          status: "OPEN",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal membuat komplain");
      setCustomerId("");
      setTitle("");
      setDescription("");
      setChannel("");
      loadComplaints({ status: statusFilter, q: query.trim() });
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">CRM - Manajemen Komplain</h1>
          <p className="text-sm text-gray-500">Catat keluhan pelanggan dan status penanganannya.</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-white border rounded p-4 space-y-4">
            <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
              <input
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder="Cari judul/keluhan/pelanggan"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-2 py-2 text-sm"
              >
                <option value="ALL">Semua Status</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button className="px-3 py-2 text-sm bg-black text-white rounded">Cari</button>
            </form>

            {loading ? (
              <div className="text-sm text-gray-500">Memuat komplain...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left">Pelanggan</th>
                      <th className="p-2 border text-left">Judul</th>
                      <th className="p-2 border text-left">Status</th>
                      <th className="p-2 border text-left">Channel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c.id}>
                        <td className="p-2 border">{c.customer.name}</td>
                        <td className="p-2 border">
                          <div className="font-medium">{c.title}</div>
                          <div className="text-xs text-gray-500">{c.description}</div>
                        </td>
                        <td className="p-2 border">{c.status}</td>
                        <td className="p-2 border">{c.channel || "-"}</td>
                      </tr>
                    ))}
                    {!complaints.length && (
                      <tr>
                        <td className="p-4 border text-center text-gray-500" colSpan={4}>
                          Belum ada komplain.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Tambah Komplain</h2>
            {!hasPermission("crm_manage") && (
              <div className="text-xs text-gray-500">Perlu permission crm_manage untuk menambah komplain.</div>
            )}
            <form onSubmit={onCreate} className="space-y-3">
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              >
                <option value="">Pilih pelanggan</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Judul komplain"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              />
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Deskripsi komplain"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!hasPermission("crm_manage")}
                rows={3}
              />
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Channel (Whatsapp/Email/Phone)"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              />
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

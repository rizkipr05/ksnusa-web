"use client";
import React, { useEffect, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";

type FollowUp = {
  id: string;
  type: string;
  status: string;
  dueAt: string;
  message: string;
  customer: { id: string; name: string };
};

type CustomerOption = { id: string; name: string };

const statuses = ["PENDING", "DONE", "CANCELLED"];
const types = ["REMINDER", "POST_SERVICE", "PROMO"];

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [type, setType] = useState("REMINDER");
  const [dueAt, setDueAt] = useState("");
  const [message, setMessage] = useState("");

  const { hasPermission } = usePermission();

  const loadFollowups = async (filters?: { status?: string; type?: string }) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "ALL") params.set("status", filters.status);
      if (filters?.type && filters.type !== "ALL") params.set("type", filters.type);
      const res = await fetch(`/api/crm/followups?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal memuat follow-up");
      setFollowups(data.result || []);
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
    loadFollowups();
    loadCustomers();
  }, []);

  const onFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadFollowups({ status: statusFilter, type: typeFilter });
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/crm/followups", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId, type, dueAt, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal membuat follow-up");
      setCustomerId("");
      setType("REMINDER");
      setDueAt("");
      setMessage("");
      loadFollowups({ status: statusFilter, type: typeFilter });
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">CRM - Follow Up</h1>
          <p className="text-sm text-gray-500">Reminder servis berkala, follow-up pasca servis, dan promo.</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-white border rounded p-4 space-y-4">
            <form onSubmit={onFilter} className="flex flex-wrap items-center gap-2">
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
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border rounded px-2 py-2 text-sm"
              >
                <option value="ALL">Semua Tipe</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button className="px-3 py-2 text-sm bg-black text-white rounded">Filter</button>
            </form>

            {loading ? (
              <div className="text-sm text-gray-500">Memuat follow-up...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left">Pelanggan</th>
                      <th className="p-2 border text-left">Tipe</th>
                      <th className="p-2 border text-left">Jadwal</th>
                      <th className="p-2 border text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followups.map((f) => (
                      <tr key={f.id}>
                        <td className="p-2 border">{f.customer.name}</td>
                        <td className="p-2 border">{f.type}</td>
                        <td className="p-2 border">{new Date(f.dueAt).toLocaleDateString("id-ID")}</td>
                        <td className="p-2 border">{f.status}</td>
                      </tr>
                    ))}
                    {!followups.length && (
                      <tr>
                        <td className="p-4 border text-center text-gray-500" colSpan={4}>
                          Belum ada follow-up.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Tambah Follow Up</h2>
            {!hasPermission("crm_manage") && (
              <div className="text-xs text-gray-500">Perlu permission crm_manage untuk menambah follow-up.</div>
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
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              >
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-sm"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              />
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Pesan follow-up"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!hasPermission("crm_manage")}
                rows={3}
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

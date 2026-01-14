"use client";
import React, { useEffect, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";

type LogRow = {
  id: string;
  type: string;
  channel?: string | null;
  message: string;
  status: string;
  sentAt?: string | null;
  customer: { id: string; name: string };
};

type CustomerOption = { id: string; name: string };

const types = ["CALL", "WHATSAPP", "EMAIL", "PROMO"];
const statuses = ["SENT", "FAILED", "DRAFT"];

export default function CommunicationsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [type, setType] = useState("CALL");
  const [channel, setChannel] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("SENT");
  const [sentAt, setSentAt] = useState("");

  const { hasPermission } = usePermission();

  const loadLogs = async (filters?: { type?: string; status?: string }) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filters?.type && filters.type !== "ALL") params.set("type", filters.type);
      if (filters?.status && filters.status !== "ALL") params.set("status", filters.status);
      const res = await fetch(`/api/crm/communications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal memuat komunikasi");
      setLogs(data.result || []);
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
    if (res.ok) setCustomers(data.result || []);
  };

  useEffect(() => {
    loadLogs();
    loadCustomers();
  }, []);

  const onFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs({ type: typeFilter, status: statusFilter });
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/crm/communications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          type,
          channel,
          message,
          status,
          sentAt: sentAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal membuat log");
      setCustomerId("");
      setType("CALL");
      setChannel("");
      setMessage("");
      setStatus("SENT");
      setSentAt("");
      loadLogs({ type: typeFilter, status: statusFilter });
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">CRM - Histori Komunikasi</h1>
          <p className="text-sm text-gray-500">Log komunikasi pelanggan (telepon, WhatsApp, email).</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-white border rounded p-4 space-y-4">
            <form onSubmit={onFilter} className="flex flex-wrap items-center gap-2">
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
              <button className="px-3 py-2 text-sm bg-black text-white rounded">Filter</button>
            </form>

            {loading ? (
              <div className="text-sm text-gray-500">Memuat log komunikasi...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left">Pelanggan</th>
                      <th className="p-2 border text-left">Tipe</th>
                      <th className="p-2 border text-left">Status</th>
                      <th className="p-2 border text-left">Pesan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td className="p-2 border">{l.customer.name}</td>
                        <td className="p-2 border">{l.type}</td>
                        <td className="p-2 border">{l.status}</td>
                        <td className="p-2 border text-xs text-gray-600">{l.message}</td>
                      </tr>
                    ))}
                    {!logs.length && (
                      <tr>
                        <td colSpan={4} className="p-4 border text-center text-gray-500">
                          Belum ada log komunikasi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Tambah Log</h2>
            {!hasPermission("crm_manage") && (
              <div className="text-xs text-gray-500">Perlu permission crm_manage untuk menambah log.</div>
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
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Channel (WhatsApp/Email/Phone)"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              />
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Pesan komunikasi"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!hasPermission("crm_manage")}
                rows={3}
              />
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-sm"
                value={sentAt}
                onChange={(e) => setSentAt(e.target.value)}
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

"use client";
import React, { useEffect, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";

type Survey = {
  id: string;
  rating: number;
  feedback?: string | null;
  channel?: string | null;
  createdAt: string;
  customer: { id: string; name: string };
  serviceOrder?: { orderNumber: string } | null;
};

type CustomerOption = { id: string; name: string };

const ratings = [5, 4, 3, 2, 1];

export default function SatisfactionPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [rating, setRating] = useState("5");
  const [feedback, setFeedback] = useState("");
  const [channel, setChannel] = useState("");

  const { hasPermission } = usePermission();

  const loadSurveys = async (filter?: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filter && filter !== "ALL") params.set("rating", filter);
      const res = await fetch(`/api/crm/satisfaction?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal memuat survei");
      setSurveys(data.result || []);
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
    loadSurveys();
    loadCustomers();
  }, []);

  const onFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadSurveys(ratingFilter);
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/crm/satisfaction", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          rating: Number(rating),
          feedback,
          channel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal membuat survei");
      setCustomerId("");
      setRating("5");
      setFeedback("");
      setChannel("");
      loadSurveys(ratingFilter);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">CRM - Kepuasan Pelanggan</h1>
          <p className="text-sm text-gray-500">Catat rating dan feedback pelanggan setelah servis.</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-white border rounded p-4 space-y-4">
            <form onSubmit={onFilter} className="flex items-center gap-2">
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="border rounded px-2 py-2 text-sm"
              >
                <option value="ALL">Semua Rating</option>
                {ratings.map((r) => (
                  <option key={r} value={String(r)}>{r} Bintang</option>
                ))}
              </select>
              <button className="px-3 py-2 text-sm bg-black text-white rounded">Filter</button>
            </form>

            {loading ? (
              <div className="text-sm text-gray-500">Memuat survei...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left">Pelanggan</th>
                      <th className="p-2 border text-left">Rating</th>
                      <th className="p-2 border text-left">Feedback</th>
                      <th className="p-2 border text-left">Channel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map((s) => (
                      <tr key={s.id}>
                        <td className="p-2 border">{s.customer.name}</td>
                        <td className="p-2 border">{s.rating}★</td>
                        <td className="p-2 border text-xs text-gray-600">{s.feedback || "-"}</td>
                        <td className="p-2 border">{s.channel || "-"}</td>
                      </tr>
                    ))}
                    {!surveys.length && (
                      <tr>
                        <td colSpan={4} className="p-4 border text-center text-gray-500">
                          Belum ada survei.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Tambah Survei</h2>
            {!hasPermission("crm_manage") && (
              <div className="text-xs text-gray-500">Perlu permission crm_manage untuk menambah survei.</div>
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
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              >
                {ratings.map((r) => (
                  <option key={r} value={String(r)}>{r} Bintang</option>
                ))}
              </select>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Feedback pelanggan"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={!hasPermission("crm_manage")}
                rows={3}
              />
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Channel (WhatsApp/Email/Phone)"
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

"use client";
import React, { useEffect, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";

type PromoCandidate = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  tier: string;
  valueTier: string;
  lastServiceAt: string | null;
  promoTitle: string;
  message: string;
};

export default function PromoPage() {
  const [candidates, setCandidates] = useState<PromoCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [campaign, setCampaign] = useState("Promo Personal");
  const [message, setMessage] = useState("Halo! Ada promo servis berkala untuk kamu. Yuk booking minggu ini.");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const { hasPermission } = usePermission();

  const loadCandidates = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/crm/promo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal memuat kandidat promo");
      setCandidates(data.result || []);
      setSelectedIds([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const toggleAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map((c) => c.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!selectedIds.length) {
      setError("Pilih minimal satu pelanggan.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/crm/promo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerIds: selectedIds,
          campaign,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal mengirim promo");
      setNotice(`Promo terkirim ke ${data.created} pelanggan.`);
      loadCandidates();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">CRM - Notifikasi Promo Personal</h1>
          <p className="text-sm text-gray-500">Kirim promo otomatis ke pelanggan yang jarang servis.</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {notice && <div className="text-sm text-green-600">{notice}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-white border rounded p-4 space-y-4">
            {loading ? (
              <div className="text-sm text-gray-500">Memuat kandidat promo...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === candidates.length && candidates.length > 0}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="p-2 border text-left">Pelanggan</th>
                      <th className="p-2 border text-left">Tier</th>
                      <th className="p-2 border text-left">Value</th>
                      <th className="p-2 border text-left">Last Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr key={c.id}>
                        <td className="p-2 border">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggleOne(c.id)}
                          />
                        </td>
                        <td className="p-2 border">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.phone || c.email || "-"}</div>
                        </td>
                        <td className="p-2 border">{c.tier}</td>
                        <td className="p-2 border">{c.valueTier}</td>
                        <td className="p-2 border">
                          {c.lastServiceAt ? new Date(c.lastServiceAt).toLocaleDateString("id-ID") : "-"}
                        </td>
                      </tr>
                    ))}
                    {!candidates.length && (
                      <tr>
                        <td className="p-4 border text-center text-gray-500" colSpan={5}>
                          Tidak ada kandidat promo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Kirim Promo</h2>
            {!hasPermission("crm_manage") && (
              <div className="text-xs text-gray-500">Perlu permission crm_manage untuk mengirim promo.</div>
            )}
            <form onSubmit={onSend} className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Nama campaign"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                disabled={!hasPermission("crm_manage")}
              />
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Pesan promo"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!hasPermission("crm_manage")}
                rows={4}
              />
              <button
                className="w-full bg-black text-white rounded py-2 text-sm disabled:opacity-60"
                disabled={!hasPermission("crm_manage")}
              >
                Kirim ke {selectedIds.length} pelanggan
              </button>
            </form>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";

type LoyaltyProfile = {
  id: string;
  points: number;
  lifetimePoints: number;
  tier: string;
};

type CustomerRow = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  profile: LoyaltyProfile | null;
  rewards: Reward[];
};

type Transaction = {
  id: string;
  points: number;
  type: string;
  reason?: string | null;
  createdAt: string;
};

type Reward = {
  id: string;
  title: string;
  type: string;
  status: string;
  issuedAt: string;
  redeemedAt?: string | null;
};

type Benefit = {
  id: string;
  tier: string;
  title: string;
  description?: string | null;
  discountPercent?: number | null;
};

export default function LoyaltyPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjustPoints, setAdjustPoints] = useState("");
  const [reason, setReason] = useState("");

  const { hasPermission } = usePermission();

  const loadCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/crm/loyalty", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal memuat loyalty");
      setCustomers(data.result || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBenefits = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/crm/loyalty/benefits", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setBenefits(data.result || []);
    }
  };

  const loadRewards = async (customerId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/crm/loyalty/rewards?customerId=${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setRewards(data.result || []);
    }
  };

  const loadHistory = async (customerId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/crm/loyalty/history/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setHistory(data.result || []);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadBenefits();
  }, []);

  const onSelect = (customer: CustomerRow) => {
    setSelected(customer);
    setHistory([]);
    setRewards([]);
    loadHistory(customer.id);
    loadRewards(customer.id);
  };

  const onAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selected) return;
    try {
      const token = localStorage.getItem("token");
      const points = Number(adjustPoints);
      const res = await fetch("/api/crm/loyalty/adjust", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId: selected.id, points, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal update poin");
      setAdjustPoints("");
      setReason("");
      await loadCustomers();
      await loadHistory(selected.id);
      await loadRewards(selected.id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onRedeem = async (rewardId: string) => {
    if (!selected) return;
    const token = localStorage.getItem("token");
    const res = await fetch("/api/crm/loyalty/rewards", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rewardId }),
    });
    if (res.ok) {
      loadRewards(selected.id);
      loadCustomers();
    }
  };

  return (
    <PermissionGuard requiredPermission="crm_view">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">CRM - Loyalty Program</h1>
          <p className="text-sm text-gray-500">Kelola poin dan tier membership pelanggan.</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-white border rounded p-4 space-y-4">
            {loading ? (
              <div className="text-sm text-gray-500">Memuat data loyalty...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left">Pelanggan</th>
                      <th className="p-2 border text-left">Tier</th>
                      <th className="p-2 border text-right">Poin</th>
                      <th className="p-2 border text-right">Lifetime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelect(c)}>
                        <td className="p-2 border">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.email || "-"}</div>
                          {c.rewards?.length ? (
                            <div className="text-[11px] text-orange-500 mt-1">
                              {c.rewards.length} reward pending
                            </div>
                          ) : null}
                        </td>
                        <td className="p-2 border">{c.profile?.tier || "-"}</td>
                        <td className="p-2 border text-right">{c.profile?.points ?? 0}</td>
                        <td className="p-2 border text-right">{c.profile?.lifetimePoints ?? 0}</td>
                      </tr>
                    ))}
                    {!customers.length && (
                      <tr>
                        <td colSpan={4} className="p-4 border text-center text-gray-500">
                          Belum ada data pelanggan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Detail Loyalty</h2>
            {!selected && <div className="text-sm text-gray-500">Pilih pelanggan untuk melihat detail.</div>}
            {selected && (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">{selected.name}</div>
                  <div className="text-xs text-gray-500">{selected.email || "-"}</div>
                </div>
                <div className="text-sm">
                  <div>Tier: {selected.profile?.tier || "Silver"}</div>
                  <div>Poin: {selected.profile?.points ?? 0}</div>
                  <div>Lifetime: {selected.profile?.lifetimePoints ?? 0}</div>
                </div>

                <form onSubmit={onAdjust} className="space-y-2">
                  {!hasPermission("crm_manage") && (
                    <div className="text-xs text-gray-500">Perlu permission crm_manage untuk ubah poin.</div>
                  )}
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Tambah/Kurangi poin (contoh: 50 atau -30)"
                    value={adjustPoints}
                    onChange={(e) => setAdjustPoints(e.target.value)}
                    disabled={!hasPermission("crm_manage")}
                  />
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Alasan penyesuaian"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={!hasPermission("crm_manage")}
                  />
                  <button
                    className="w-full bg-black text-white rounded py-2 text-sm disabled:opacity-60"
                    disabled={!hasPermission("crm_manage")}
                  >
                    Update Poin
                  </button>
                </form>

                <div>
                  <div className="text-sm font-medium mb-2">Riwayat Poin (20 terakhir)</div>
                  <div className="max-h-48 overflow-y-auto border rounded">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2 border text-left">Tanggal</th>
                          <th className="p-2 border text-left">Tipe</th>
                          <th className="p-2 border text-right">Poin</th>
                          <th className="p-2 border text-left">Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id}>
                            <td className="p-2 border">{new Date(h.createdAt).toLocaleDateString("id-ID")}</td>
                            <td className="p-2 border">{h.type}</td>
                            <td className="p-2 border text-right">{h.points}</td>
                            <td className="p-2 border">{h.reason || "-"}</td>
                          </tr>
                        ))}
                        {!history.length && (
                          <tr>
                            <td colSpan={4} className="p-3 border text-center text-gray-500">
                              Belum ada transaksi poin.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Reward</div>
                  <div className="space-y-2">
                    {rewards.length ? (
                      rewards.map((r) => (
                        <div key={r.id} className="border rounded p-2 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-medium">{r.title}</div>
                            <div className="text-gray-500">{r.status}</div>
                          </div>
                          {hasPermission("crm_manage") && r.status === "PENDING" && (
                            <button
                              className="px-2 py-1 text-xs border rounded"
                              onClick={() => onRedeem(r.id)}
                            >
                              Redeem
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500">Belum ada reward.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Benefit Tier</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.id} className="border rounded p-3 text-sm">
                <div className="text-xs text-gray-500">{b.tier}</div>
                <div className="font-medium">{b.title}</div>
                <div className="text-gray-600 mt-1">{b.description || "-"}</div>
                {b.discountPercent ? (
                  <div className="text-xs text-gray-500 mt-2">Diskon {b.discountPercent}%</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}

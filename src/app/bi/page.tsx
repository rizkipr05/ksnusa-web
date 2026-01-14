"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PermissionGuard from "@/components/PermissionGuard";

type ServiceKey = { key: string; label: string };

type BIOverview = {
  summary: {
    totalService: number;
    totalParts: number;
    totalRevenue: number;
    peakSeasonMonth: string;
  };
  serviceTrends: Array<Record<string, number | string>>;
  serviceKeys: ServiceKey[];
  partsTrends: Array<Record<string, number | string>>;
  topCategories: string[];
  seasonality: Array<{ month: string; average: number; index: number }>;
  forecast: {
    service: Array<{ month: string; value: number }>;
    parts: Array<{ month: string; value: number }>;
    revenue: Array<{ month: string; value: number }>;
    model?: {
      service?: string;
      parts?: string;
      revenue?: string;
    };
  };
  insights: Array<{ title: string; detail: string; level: string }>;
};

type Alert = {
  title: string;
  detail: string;
  change: number;
  month: string;
  metric: string;
  level: string;
};

type Recommendation = {
  title: string;
  detail: string;
  type: string;
};

type ExpansionProjection = {
  scenario: string;
  growth: number;
  items: Array<{ month: string; services: number; revenue: number }>;
};

const palette = ["#0f766e", "#3b82f6", "#f97316", "#8b5cf6", "#14b8a6", "#f43f5e"];

export default function BIPage() {
  const [overview, setOverview] = useState<BIOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertThreshold, setAlertThreshold] = useState(25);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [expansion, setExpansion] = useState<ExpansionProjection[]>([]);
  const [expansionMonths, setExpansionMonths] = useState(3);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/bi/overview", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setOverview(d?.error ? null : d))
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/bi/alerts?threshold=${alertThreshold}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setAlerts(d?.alerts || []))
      .catch(() => setAlerts([]));
  }, [alertThreshold]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/bi/recommendations", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setRecommendations(d?.recommendations || []))
      .catch(() => setRecommendations([]));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/bi/expansion?months=${expansionMonths}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setExpansion(d?.projections || []))
      .catch(() => setExpansion([]));
  }, [expansionMonths]);

  const forecastSeries = useMemo(() => {
    if (!overview?.forecast) return [];
    const map = new Map<string, { month: string; service?: number; parts?: number; revenue?: number }>();
    overview.forecast.service.forEach((item) => {
      map.set(item.month, { month: item.month, service: item.value });
    });
    overview.forecast.parts.forEach((item) => {
      const existing = map.get(item.month) || { month: item.month };
      existing.parts = item.value;
      map.set(item.month, existing);
    });
    overview.forecast.revenue.forEach((item) => {
      const existing = map.get(item.month) || { month: item.month };
      existing.revenue = item.value;
      map.set(item.month, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [overview]);

  return (
    <PermissionGuard requiredPermission="bi_view">
      <div className="p-6 space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Analisis Tren Pasar Bengkel</h1>
          <p className="text-sm text-gray-500">
            Ringkasan performa layanan, tren suku cadang, musiman event balap, dan prediksi permintaan.
          </p>
        </div>

        {loading && <div className="text-sm text-gray-500">Memuat dashboard BI...</div>}

        {!loading && overview && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-white rounded border p-4">
                <div className="text-xs uppercase text-gray-500">Total Layanan</div>
                <div className="text-2xl font-semibold">{overview.summary.totalService}</div>
                <div className="text-xs text-gray-400">Semua layanan tercatat</div>
              </div>
              <div className="bg-white rounded border p-4">
                <div className="text-xs uppercase text-gray-500">Suku Cadang Keluar</div>
                <div className="text-2xl font-semibold">{overview.summary.totalParts}</div>
                <div className="text-xs text-gray-400">Berdasarkan transaksi OUT</div>
              </div>
              <div className="bg-white rounded border p-4">
                <div className="text-xs uppercase text-gray-500">Pendapatan Tercatat</div>
                <div className="text-2xl font-semibold">
                  Rp {overview.summary.totalRevenue.toLocaleString("id-ID")}
                </div>
                <div className="text-xs text-gray-400">Akumulasi total biaya servis</div>
              </div>
              <div className="bg-white rounded border p-4">
                <div className="text-xs uppercase text-gray-500">Puncak Musiman</div>
                <div className="text-2xl font-semibold">{overview.summary.peakSeasonMonth}</div>
                <div className="text-xs text-gray-400">Indikasi event balap</div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white rounded border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold">Tren Jenis Layanan</h2>
                    <p className="text-xs text-gray-500">Tuning, engine rebuild, race preparation.</p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overview.serviceTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {overview.serviceKeys.map((item, idx) => (
                        <Line
                          key={item.key}
                          type="monotone"
                          dataKey={item.key}
                          name={item.label}
                          stroke={palette[idx % palette.length]}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold">Tren Penggunaan Suku Cadang</h2>
                    <p className="text-xs text-gray-500">Top kategori berdasarkan transaksi OUT.</p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview.partsTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {overview.topCategories.map((category, idx) => (
                        <Bar
                          key={category}
                          dataKey={category}
                          stackId="parts"
                          name={category}
                          fill={palette[(idx + 1) % palette.length]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white rounded border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold">Musiman Event Balap</h2>
                    <p className="text-xs text-gray-500">Indeks aktivitas layanan per bulan.</p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview.seasonality}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="index" fill="#0f766e" name="Indeks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold">Prediksi Permintaan</h2>
                    <p className="text-xs text-gray-500">
                      Holt-Winters 3 bulan ke depan (fallback: moving average).
                    </p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastSeries}>
                      <defs>
                        <linearGradient id="colorService" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorParts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="service"
                        stroke="#3b82f6"
                        fill="url(#colorService)"
                        name="Servis"
                      />
                      <Area
                        type="monotone"
                        dataKey="parts"
                        stroke="#f97316"
                        fill="url(#colorParts)"
                        name="Sparepart"
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#0f766e" name="Pendapatan" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {overview.insights.map((insight) => (
                <div key={insight.title} className="bg-white rounded border p-4">
                  <div className="text-xs uppercase text-gray-500">{insight.title}</div>
                  <div className="mt-2 text-sm text-gray-700">{insight.detail}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Notifikasi Tren Signifikan</h2>
                  <p className="text-xs text-gray-500">Alert jika perubahan di atas threshold.</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Threshold</span>
                  <select
                    className="border rounded px-2 py-1"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  >
                    <option value={15}>15%</option>
                    <option value={25}>25%</option>
                    <option value={40}>40%</option>
                  </select>
                </div>
              </div>
              {alerts.length ? (
                <div className="space-y-2 text-sm">
                  {alerts.map((alert) => (
                    <div key={`${alert.metric}-${alert.month}`} className="border rounded p-3">
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-gray-600">{alert.detail}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Belum ada perubahan signifikan.</div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white rounded border p-4 space-y-3">
                <div>
                  <h2 className="font-semibold">Rekomendasi Layanan Baru</h2>
                  <p className="text-xs text-gray-500">Saran layanan berdasarkan tren servis & sparepart.</p>
                </div>
                {recommendations.length ? (
                  <div className="space-y-2 text-sm">
                    {recommendations.map((rec) => (
                      <div key={`${rec.title}-${rec.type}`} className="border rounded p-3">
                        <div className="font-medium">{rec.title}</div>
                        <div className="text-gray-600">{rec.detail}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Belum ada rekomendasi.</div>
                )}
              </div>

              <div className="bg-white rounded border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Simulasi Ekspansi Pasar</h2>
                    <p className="text-xs text-gray-500">Proyeksi layanan & pendapatan.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Periode</span>
                    <select
                      className="border rounded px-2 py-1"
                      value={expansionMonths}
                      onChange={(e) => setExpansionMonths(Number(e.target.value))}
                    >
                      <option value={3}>3 bulan</option>
                      <option value={6}>6 bulan</option>
                    </select>
                  </div>
                </div>
                {expansion.length ? (
                  <div className="space-y-3 text-sm">
                    {expansion.map((scenario) => (
                      <div key={scenario.scenario} className="border rounded p-3">
                        <div className="font-medium">{scenario.scenario}</div>
                        <div className="text-xs text-gray-500 mb-2">
                          Growth {(scenario.growth * 100).toFixed(0)}%
                        </div>
                        <div className="space-y-1">
                          {scenario.items.map((item) => (
                            <div key={item.month} className="flex items-center justify-between">
                              <span>{item.month}</span>
                              <span>{item.services} servis · Rp {item.revenue.toLocaleString("id-ID")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Belum ada simulasi.</div>
                )}
              </div>
            </div>
          </>
        )}

        {!loading && !overview && (
          <div className="text-sm text-gray-500">Belum ada data BI untuk ditampilkan.</div>
        )}
      </div>
    </PermissionGuard>
  );
}

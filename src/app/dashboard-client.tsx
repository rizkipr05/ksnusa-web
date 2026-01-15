"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  LineChart
} from "recharts";
import { Package, AlertTriangle, ShoppingCart, DollarSign, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

export default function DashboardClient({ stats, salesData, categoryDist, recentActivity, lowStockItems, biData }: any) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const palette = ["#0f766e", "#3b82f6", "#f97316", "#8b5cf6", "#14b8a6", "#f43f5e"];

  const [biDataState, setBiDataState] = useState(biData || []);
  const [groupBy, setGroupBy] = useState("category");

  const [biOverview, setBiOverview] = useState<any>(null);
  const [biAlerts, setBiAlerts] = useState<any[]>([]);
  const [biRecommendations, setBiRecommendations] = useState<any[]>([]);
  const [biExpansion, setBiExpansion] = useState<any[]>([]);
  const [biSegmentation, setBiSegmentation] = useState<any>(null);
  const [biLoading, setBiLoading] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(25);
  const [expansionMonths, setExpansionMonths] = useState(3);

  const [crmSegmentation, setCrmSegmentation] = useState<any>(null);
  const [crmComplaints, setCrmComplaints] = useState<any[]>([]);
  const [crmFollowups, setCrmFollowups] = useState<any[]>([]);
  const [crmLoyalty, setCrmLoyalty] = useState<any[]>([]);
  const [crmSatisfaction, setCrmSatisfaction] = useState<any[]>([]);
  const [crmCommunications, setCrmCommunications] = useState<any[]>([]);
  const [crmPromo, setCrmPromo] = useState<any[]>([]);
  const [crmLoading, setCrmLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/olap/aggregate?groupBy=${groupBy}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setBiDataState(d.result || []))
      .catch(() => setBiDataState([]));
  }, [groupBy]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setBiLoading(false);
      return;
    }
    Promise.all([
      fetch("/api/bi/overview", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .catch(() => null),
      fetch("/api/bi/recommendations", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .catch(() => ({ recommendations: [] })),
      fetch("/api/bi/segmentation", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([overviewRes, recRes, segmentationRes]) => {
        setBiOverview(overviewRes?.error ? null : overviewRes);
        setBiRecommendations(recRes?.recommendations || []);
        setBiSegmentation(segmentationRes?.error ? null : segmentationRes);
      })
      .finally(() => setBiLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`/api/bi/alerts?threshold=${alertThreshold}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setBiAlerts(d?.alerts || []))
      .catch(() => setBiAlerts([]));
  }, [alertThreshold]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`/api/bi/expansion?months=${expansionMonths}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setBiExpansion(d?.projections || []))
      .catch(() => setBiExpansion([]));
  }, [expansionMonths]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCrmLoading(false);
      return;
    }
    Promise.all([
      fetch("/api/crm/segmentation", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .catch(() => null),
      fetch("/api/crm/complaints?status=ALL", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .catch(() => ({ result: [] })),
      fetch("/api/crm/followups?status=ALL", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .catch(() => ({ result: [] })),
      fetch("/api/crm/loyalty", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .catch(() => ({ result: [] })),
      fetch("/api/crm/satisfaction", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .catch(() => ({ result: [] })),
      fetch("/api/crm/communications?status=ALL", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .catch(() => ({ result: [] })),
      fetch("/api/crm/promo", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .catch(() => ({ result: [] })),
    ])
      .then(([segRes, complaintsRes, followupsRes, loyaltyRes, satisfactionRes, commRes, promoRes]) => {
        setCrmSegmentation(segRes?.error ? null : segRes);
        setCrmComplaints(complaintsRes?.result || []);
        setCrmFollowups(followupsRes?.result || []);
        setCrmLoyalty(loyaltyRes?.result || []);
        setCrmSatisfaction(satisfactionRes?.result || []);
        setCrmCommunications(commRes?.result || []);
        setCrmPromo(promoRes?.result || []);
      })
      .finally(() => setCrmLoading(false));
  }, []);

  const forecastSeries = useMemo(() => {
    if (!biOverview?.forecast) return [];
    const map = new Map<string, { month: string; service?: number; parts?: number; revenue?: number }>();
    biOverview.forecast.service.forEach((item: any) => {
      map.set(item.month, { month: item.month, service: item.value });
    });
    biOverview.forecast.parts.forEach((item: any) => {
      const existing = map.get(item.month) || { month: item.month };
      const normalized = existing as { month: string; service?: number; parts?: number; revenue?: number };
      normalized.parts = item.value;
      map.set(item.month, normalized);
    });
    biOverview.forecast.revenue.forEach((item: any) => {
      const existing = map.get(item.month) || { month: item.month };
      const normalized = existing as { month: string; service?: number; parts?: number; revenue?: number };
      normalized.revenue = item.value;
      map.set(item.month, normalized);
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [biOverview]);

  const typeLabels = useMemo(
    () => ({
      INDIVIDU: "Individu",
      KOMUNITAS: "Komunitas",
      RACING_TEAM: "Racing Team",
      UNKNOWN: "Lainnya",
    }),
    []
  );

  const loyaltyTierCounts = useMemo(() => {
    const tiers: Record<string, number> = {};
    crmLoyalty.forEach((c) => {
      const tier = c.profile?.tier || "Silver";
      tiers[tier] = (tiers[tier] || 0) + 1;
    });
    return tiers;
  }, [crmLoyalty]);

  const satisfactionAvg = useMemo(() => {
    if (!crmSatisfaction.length) return 0;
    const total = crmSatisfaction.reduce((acc, s) => acc + Number(s.rating || 0), 0);
    return Math.round((total / crmSatisfaction.length) * 10) / 10;
  }, [crmSatisfaction]);

  return (
    <div className="space-y-6">
      
      {/* HEADER & TOMBOL SHORTCUT */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Utama</h2>
        <div className="flex gap-2">
           <Link href="/orders">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Input Transaksi
            </Button>
           </Link>
        </div>
      </div>

      {/* 1. KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Pendapatan" value={`Rp ${stats.monthlyRevenue.toLocaleString('id-ID')}`} icon={DollarSign} green />
        <KpiCard title="Total Transaksi" value={recentActivity.length > 0 ? "Aktif" : "Kosong"} icon={ShoppingCart} />
        <KpiCard title="Total SKU" value={stats.totalParts} icon={Package} />
        <KpiCard title="Stok Menipis" value={stats.lowStockAlerts} icon={AlertTriangle} alert />
      </div>

      {/* 2. VISUALISASI GRAFIK (YANG SEMPAT HILANG) */}
      <div className="grid gap-4 md:grid-cols-7">
        
        {/* GRAFIK 1: BAR CHART (Top Sales) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top Produk Terlaris</CardTitle>
            <CardDescription>Visualisasi item dengan perputaran tertinggi.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalSold" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Terjual" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Belum ada data penjualan</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* GRAFIK 2: PIE CHART (Kategori Stok) */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribusi Stok</CardTitle>
            <CardDescription>Proporsi stok berdasarkan kategori.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDist}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryDist.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Stok kosong</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. BI DASHBOARD SECTION */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="border px-3 py-2 rounded-md bg-white"
          >
            <option value="category">Group by Category</option>
            <option value="supplier">Group by Supplier</option>
            <option value="date">Group by Date</option>
          </select>
        </div>

        {/* BI Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics Overview</CardTitle>
            <CardDescription>Aggregated data by {groupBy}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {biDataState.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={biDataState}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#82ca9d" name="Amount" />
                    <Bar dataKey="quantity" fill="#8884d8" name="Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BI Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 border text-left">Group</th>
                    <th className="p-3 border text-left">Items</th>
                    <th className="p-3 border text-right">Quantity</th>
                    <th className="p-3 border text-right">Amount</th>
                    <th className="p-3 border text-left">Product Names</th>
                  </tr>
                </thead>
                <tbody>
                  {biDataState.map((r: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3 border font-medium">{r.label}</td>
                      <td className="p-3 border text-center">{r.items}</td>
                      <td className="p-3 border text-right">{r.quantity}</td>
                      <td className="p-3 border text-right">{r.amount.toLocaleString()}</td>
                      <td className="p-3 border">
                        <div className="max-w-xs truncate" title={r.itemNames?.join(', ')}>
                          {r.itemNames?.join(', ') || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3b. BI - ANALISIS TREN PASAR */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">BI - Analisis Tren Pasar Bengkel</h2>
            <p className="text-sm text-muted-foreground">
              Tren layanan, suku cadang, musiman event, prediksi permintaan, dan rekomendasi.
            </p>
          </div>
        </div>

        {biLoading && <div className="text-sm text-muted-foreground">Memuat data BI...</div>}

        {!biLoading && biOverview && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Total Layanan</div>
                  <div className="text-2xl font-semibold">{biOverview.summary.totalService}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Suku Cadang Keluar</div>
                  <div className="text-2xl font-semibold">{biOverview.summary.totalParts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Pendapatan</div>
                  <div className="text-2xl font-semibold">
                    Rp {biOverview.summary.totalRevenue.toLocaleString("id-ID")}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Puncak Musiman</div>
                  <div className="text-2xl font-semibold">{biOverview.summary.peakSeasonMonth}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tren Jenis Layanan</CardTitle>
                  <CardDescription>Tuning, engine rebuild, race preparation.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={biOverview.serviceTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {biOverview.serviceKeys.map((item: any, idx: number) => (
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tren Penggunaan Suku Cadang</CardTitle>
                  <CardDescription>Top kategori berdasarkan transaksi OUT.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={biOverview.partsTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {biOverview.topCategories.map((category: string, idx: number) => (
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
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Musiman Event Balap</CardTitle>
                  <CardDescription>Indeks aktivitas layanan per bulan.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={biOverview.seasonality}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="index" fill="#0f766e" name="Indeks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prediksi Permintaan</CardTitle>
                  <CardDescription>Proyeksi servis, sparepart, dan pendapatan.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastSeries}>
                        <defs>
                          <linearGradient id="colorServiceMain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorPartsMain" x1="0" y1="0" x2="0" y2="1">
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
                          fill="url(#colorServiceMain)"
                          name="Servis"
                        />
                        <Area
                          type="monotone"
                          dataKey="parts"
                          stroke="#f97316"
                          fill="url(#colorPartsMain)"
                          name="Sparepart"
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#0f766e" name="Pendapatan" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Insight Tren Pasar</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {biOverview.insights.map((insight: any) => (
                  <div key={insight.title} className="border rounded p-3 text-sm">
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-muted-foreground mt-1">{insight.detail}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Notifikasi Tren Signifikan</CardTitle>
                  <CardDescription>Alert perubahan di atas threshold.</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Threshold</span>
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
              </CardHeader>
              <CardContent>
                {biAlerts.length ? (
                  <div className="space-y-2 text-sm">
                    {biAlerts.map((alert) => (
                      <div key={`${alert.metric}-${alert.month}`} className="border rounded p-3">
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-muted-foreground">{alert.detail}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Belum ada perubahan signifikan.</div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Rekomendasi Layanan Baru</CardTitle>
                  <CardDescription>Saran berdasarkan tren servis & sparepart.</CardDescription>
                </CardHeader>
                <CardContent>
                  {biRecommendations.length ? (
                    <div className="space-y-2 text-sm">
                      {biRecommendations.map((rec) => (
                        <div key={`${rec.title}-${rec.type}`} className="border rounded p-3">
                          <div className="font-medium">{rec.title}</div>
                          <div className="text-muted-foreground">{rec.detail}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Belum ada rekomendasi.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Simulasi Ekspansi Pasar</CardTitle>
                    <CardDescription>Proyeksi layanan & pendapatan.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Periode</span>
                    <select
                      className="border rounded px-2 py-1"
                      value={expansionMonths}
                      onChange={(e) => setExpansionMonths(Number(e.target.value))}
                    >
                      <option value={3}>3 bulan</option>
                      <option value={6}>6 bulan</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  {biExpansion.length ? (
                    <div className="space-y-3 text-sm">
                      {biExpansion.map((scenario) => (
                        <div key={scenario.scenario} className="border rounded p-3">
                          <div className="font-medium">{scenario.scenario}</div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Growth {(scenario.growth * 100).toFixed(0)}%
                          </div>
                          <div className="space-y-1">
                            {scenario.items.map((item: any) => (
                              <div key={item.month} className="flex items-center justify-between">
                                <span>{item.month}</span>
                                <span>Rp {item.revenue.toLocaleString("id-ID")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Belum ada simulasi.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {!biLoading && !biOverview && (
          <div className="text-sm text-muted-foreground">Belum ada data BI untuk ditampilkan.</div>
        )}
      </div>

      {/* 3c. BI - SEGMENTASI PELANGGAN */}
      {biSegmentation && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">BI - Segmentasi Pelanggan</h2>
            <p className="text-sm text-muted-foreground">
              Segmentasi pelanggan berdasarkan kendaraan, frekuensi, nilai transaksi, dan prediksi ke depan.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-muted-foreground">Total Pelanggan</div>
                <div className="text-2xl font-semibold">{biSegmentation.summary.totalCustomers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-muted-foreground">Loyal</div>
                <div className="text-2xl font-semibold">{biSegmentation.summary.byFrequency.Loyal || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-muted-foreground">Repeat</div>
                <div className="text-2xl font-semibold">{biSegmentation.summary.byFrequency.Repeat || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-muted-foreground">New</div>
                <div className="text-2xl font-semibold">{biSegmentation.summary.byFrequency.New || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Klasifikasi Pelanggan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {biSegmentation.summary.typeSegments.length ? (
                  biSegmentation.summary.typeSegments.map((t: any) => (
                    <div key={t.type} className="flex items-center justify-between">
                      <span>{typeLabels[t.type as keyof typeof typeLabels] || t.type}</span>
                      <span className="font-medium">{t.total}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Belum ada klasifikasi pelanggan.</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Brand Kendaraan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {biSegmentation.summary.topBrands.length ? (
                  biSegmentation.summary.topBrands.map((b: any) => (
                    <div key={b.brand} className="flex items-center justify-between">
                      <span>{b.brand}</span>
                      <span className="font-medium">{b.total}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Belum ada data kendaraan.</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tier Nilai Pelanggan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(biSegmentation.summary.byValue).map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span>{tier}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Prediksi Segmentasi Pelanggan</CardTitle>
                <CardDescription>Proyeksi {biSegmentation.forecast.monthsAhead} bulan ke depan.</CardDescription>
              </CardHeader>
              <CardContent>
                {biSegmentation.forecast.typeForecast.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={biSegmentation.forecast.typeForecast}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {biSegmentation.forecast.typeKeys.map((key: string, idx: number) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={typeLabels[key as keyof typeof typeLabels] || key}
                            stroke={palette[idx % palette.length]}
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Belum cukup data untuk prediksi.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediksi Segmen Kendaraan</CardTitle>
                <CardDescription>Top brand berdasarkan tren historis.</CardDescription>
              </CardHeader>
              <CardContent>
                {biSegmentation.forecast.brandKeys.length && biSegmentation.forecast.brandForecast.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={biSegmentation.forecast.brandForecast}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {biSegmentation.forecast.brandKeys.map((brand: string, idx: number) => (
                          <Line
                            key={brand}
                            type="monotone"
                            dataKey={brand}
                            name={brand}
                            stroke={palette[(idx + 2) % palette.length]}
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Belum ada data brand untuk prediksi.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 4. CRM DASHBOARD SECTION */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">CRM - Ringkasan & Monitoring</h2>
          <p className="text-sm text-muted-foreground">
            Profil pelanggan, loyalti, komplain, follow-up, komunikasi, dan promo.
          </p>
        </div>

        {crmLoading && <div className="text-sm text-muted-foreground">Memuat data CRM...</div>}

        {!crmLoading && crmSegmentation && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Total Pelanggan</div>
                  <div className="text-2xl font-semibold">{crmSegmentation.summary.totalCustomers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Komplain Open</div>
                  <div className="text-2xl font-semibold">
                    {crmComplaints.filter((c) => c.status === "OPEN").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Follow-up Pending</div>
                  <div className="text-2xl font-semibold">
                    {crmFollowups.filter((f) => f.status === "PENDING").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Rata-rata Kepuasan</div>
                  <div className="text-2xl font-semibold">{satisfactionAvg || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Segmentasi Frekuensi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {Object.entries(crmSegmentation.summary.byFrequency).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between">
                      <span>{tier}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Segmentasi Nilai</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {Object.entries(crmSegmentation.summary.byValue).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between">
                      <span>{tier}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Klasifikasi Pelanggan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {crmSegmentation.summary.typeSegments.length ? (
                    crmSegmentation.summary.typeSegments.map((t: any) => (
                      <div key={t.type} className="flex items-center justify-between">
                        <span>{typeLabels[t.type as keyof typeof typeLabels] || t.type}</span>
                        <span className="font-medium">{t.total}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Belum ada klasifikasi pelanggan.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Top Brand Kendaraan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {crmSegmentation.summary.topBrands.length ? (
                    crmSegmentation.summary.topBrands.map((b: any) => (
                      <div key={b.brand} className="flex items-center justify-between">
                        <span>{b.brand}</span>
                        <span className="font-medium">{b.total}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Belum ada data kendaraan.</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Loyalty Tier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {Object.keys(loyaltyTierCounts).length ? (
                    Object.entries(loyaltyTierCounts).map(([tier, count]) => (
                      <div key={tier} className="flex items-center justify-between">
                        <span>{tier}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Belum ada data loyalty.</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Promo Kandidat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {crmPromo.length ? (
                    crmPromo.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground">{p.tier}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Belum ada kandidat promo.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Komplain Terbaru</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {crmComplaints.length ? (
                    crmComplaints.slice(0, 5).map((c) => (
                      <div key={c.id} className="border rounded p-3">
                        <div className="font-medium">{c.title}</div>
                        <div className="text-muted-foreground">
                          {c.customer?.name || "-"} • {c.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Belum ada komplain.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Follow-up Terdekat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {crmFollowups.length ? (
                    crmFollowups.slice(0, 5).map((f) => (
                      <div key={f.id} className="border rounded p-3">
                        <div className="font-medium">{f.customer?.name || "-"}</div>
                        <div className="text-muted-foreground">
                          {f.type} • {new Date(f.dueAt).toLocaleDateString("id-ID")} • {f.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Belum ada follow-up.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Riwayat Komunikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {crmCommunications.length ? (
                  crmCommunications.slice(0, 6).map((log) => (
                    <div key={log.id} className="border rounded p-3">
                      <div className="font-medium">{log.customer?.name || "-"}</div>
                      <div className="text-muted-foreground">
                        {log.type} • {log.channel || "-"} • {log.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Belum ada komunikasi.</div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!crmLoading && !crmSegmentation && (
          <div className="text-sm text-muted-foreground">Belum ada data CRM untuk ditampilkan.</div>
        )}
      </div>

      {/* 4. BAGIAN DESKRIPTIF (RECENT ACTIVITY & LOW STOCK) */}
      <div className="grid gap-4 md:grid-cols-7">
        
        {/* ACTIVITY LIST */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Aktivitas Terkini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${item.type === 'IN' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type === 'IN' ? 'Barang Masuk' : 'Penjualan'} • {new Date(item.transactionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm">{item.quantity} Unit</span>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>}
            </div>
          </CardContent>
        </Card>

        {/* LOW STOCK ALERT */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Peringatan Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.length > 0 ? lowStockItems.map((item: any, i: number) => (
                <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-red-900 text-sm">{item.name}</p>
                    <p className="text-xs text-red-600">{item.category}</p>
                  </div>
                  <Badge variant="destructive">Sisa {item.currentStock}</Badge>
                </div>
              )) : <p className="text-sm text-green-600">Semua stok aman.</p>}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, alert, green }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <Icon className={`h-4 w-4 ${alert ? "text-red-500" : green ? "text-green-500" : "text-gray-500"}`} />
        </div>
        <div className={`text-2xl font-bold ${alert ? "text-red-600" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

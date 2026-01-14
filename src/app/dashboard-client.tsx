"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Package, AlertTriangle, ShoppingCart, DollarSign, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardClient({ stats, salesData, categoryDist, recentActivity, lowStockItems, biData }: any) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const [biDataState, setBiDataState] = useState(biData || []);
  const [groupBy, setGroupBy] = useState("category");

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/olap/aggregate?groupBy=${groupBy}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setBiDataState(d.result || []))
      .catch(() => setBiDataState([]));
  }, [groupBy]);

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
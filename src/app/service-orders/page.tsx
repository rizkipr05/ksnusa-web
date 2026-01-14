"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wrench } from "lucide-react";
import PermissionGuard from "@/components/PermissionGuard";

type ServiceOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicleInfo: string;
  serviceType: string;
  description: string;
  status: string;
  scheduledDate: string;
  completedDate?: string;
  totalCost?: number;
  mechanicNotes: Array<{
    id: string;
    content: string;
    createdAt: string;
    createdBy: { name: string; email: string };
  }>;
};

export default function ServiceOrdersPage() {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [orderNumber, setOrderNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [totalCost, setTotalCost] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    setToken(t);
    if (t) fetchServiceOrders(t);
  }, []);

  async function fetchServiceOrders(t: string) {
    try {
      const res = await fetch("/api/service-orders", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (res.ok) setServiceOrders(data.serviceOrders || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!orderNumber || !customerName || !serviceType) {
      setMessage("Error: Nomor order, nama pelanggan, dan jenis servis wajib diisi");
      return;
    }

    try {
      const res = await fetch("/api/service-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderNumber,
          customerName,
          vehicleInfo,
          serviceType,
          description,
          scheduledDate: scheduledDate || new Date().toISOString(),
          totalCost: totalCost ? parseInt(totalCost) : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat order");

      setMessage("Order servis berhasil dibuat ✓");
      setIsOpen(false);
      resetForm();
      fetchServiceOrders(token);
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
  }

  async function updateOrderStatus(id: string, newStatus: string) {
    try {
      const res = await fetch("/api/service-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          status: newStatus,
          completedDate: newStatus === "COMPLETED" ? new Date().toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal update status");

      fetchServiceOrders(token);
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
  }

  function resetForm() {
    setOrderNumber("");
    setCustomerName("");
    setVehicleInfo("");
    setServiceType("");
    setDescription("");
    setScheduledDate("");
    setTotalCost("");
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Menunggu</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Dalam Proses</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Selesai</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-50 text-red-700">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <PermissionGuard requiredPermission="orders_view">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Order Servis & Perbaikan</h2>
            <p className="text-muted-foreground">Kelola order perbaikan dan servis kendaraan</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Order Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Buat Order Servis Baru</DialogTitle>
                <DialogDescription>Tambahkan order servis atau perbaikan baru</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Nomor Order *</Label>
                  <Input
                    id="orderNumber"
                    placeholder="SO-2024-001"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nama Pelanggan *</Label>
                  <Input
                    id="customerName"
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleInfo">Info Kendaraan</Label>
                  <Input
                    id="vehicleInfo"
                    placeholder="Honda Beat - B 1234 XYZ"
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Jenis Servis *</Label>
                  <Input
                    id="serviceType"
                    placeholder="Ganti Oli, Servis Berkala, Perbaikan Rem, dll"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    placeholder="Detail pekerjaan yang akan dilakukan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Tanggal Servis</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalCost">Biaya (Rp)</Label>
                    <Input
                      id="totalCost"
                      type="number"
                      placeholder="0"
                      value={totalCost}
                      onChange={(e) => setTotalCost(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Simpan Order</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {message && (
          <div className={`p-3 rounded ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Daftar Order Servis
            </CardTitle>
            <CardDescription>Kelola dan lacak status order perbaikan</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Order</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Kendaraan</TableHead>
                  <TableHead>Jenis Servis</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Biaya</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceOrders.length > 0 ? (
                  serviceOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{order.vehicleInfo || "-"}</TableCell>
                      <TableCell>{order.serviceType}</TableCell>
                      <TableCell>{new Date(order.scheduledDate).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>Rp {(order.totalCost || 0).toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Menunggu</SelectItem>
                            <SelectItem value="IN_PROGRESS">Dalam Proses</SelectItem>
                            <SelectItem value="COMPLETED">Selesai</SelectItem>
                            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Belum ada order servis.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}

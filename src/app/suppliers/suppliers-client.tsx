"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Truck, Package, TrendingUp, Trash2 } from "lucide-react";
import { AddSupplierModal } from "@/components/AddSupplierModal";
import { EditSupplierModal } from "@/components/EditSupplierModal";
import { deleteSupplier } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/usePermission";

interface SupplierData {
  id: string;
  name: string;
  productCount: number;
  revenue: number;
  sold: number;
  fastMovingCount: number;
}

export default function SuppliersClient({ data }: { data: SupplierData[] }) {
    const canEdit = usePermission("suppliers_edit");
    const canDelete = usePermission("suppliers_delete");

    async function handleDelete(id: string, name: string) {
      if (!confirm(`Apakah Anda yakin ingin menghapus supplier "${name}"?`)) {
        return;
      }

      try {
        await deleteSupplier(id);
        alert("Supplier berhasil dihapus!");
        window.location.reload();
      } catch (error: any) {
        alert(error.message || "Gagal menghapus supplier");
      }
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Analisis Supplier</h2>
              <p className="text-muted-foreground">Kelola daftar pemasok dan performa mereka.</p>
            </div>
            {/* Tombol Baru Disini */}
            <AddSupplierModal />
          </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan per Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#2563eb" : "#93c5fd"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Efektivitas Barang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.map((sup, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <Truck className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{sup.name}</p>
                    <p className="text-xs text-muted-foreground">{sup.productCount} SKU</p>
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-green-600 flex items-center gap-1 text-sm font-bold">
                    <TrendingUp className="h-3 w-3" /> {sup.fastMovingCount} Fast
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Metrik Supplier</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Supplier</TableHead>
                <TableHead className="text-center">Total SKU</TableHead>
                <TableHead className="text-center">Terjual</TableHead>
                <TableHead className="text-right">Total Pendapatan</TableHead>
                {(canEdit || canDelete) && <TableHead className="text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {item.name}
                  </TableCell>
                  <TableCell className="text-center">{item.productCount}</TableCell>
                  <TableCell className="text-center">{item.sold}</TableCell>
                  <TableCell className="text-right">Rp {item.revenue.toLocaleString('id-ID')}</TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && <EditSupplierModal supplier={{ id: item.id, name: item.name }} />}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(item.id, item.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
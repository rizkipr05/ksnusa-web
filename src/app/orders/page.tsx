import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, Calendar } from "lucide-react";
import { prisma } from "@/lib/db"; 
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { DeleteButton } from "@/components/DeleteButton"; // Import Baru
import { EditTransactionModal } from "@/components/EditTransactionModal"; // Import Baru
import PermissionGuard from "@/components/PermissionGuard";

export default async function OrdersPage() {
  const transactions = await prisma.factInventory.findMany({
    orderBy: { transactionDate: 'desc' },
    include: { product: true, supplier: true }
  });

  const productList = await prisma.product.findMany();

  return (
    <PermissionGuard requiredPermission="orders_view">
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Riwayat Transaksi</h2>
          <p className="text-muted-foreground">Sumber data operasional untuk analisis OLAP.</p>
        </div>
        <AddTransactionModal products={productList} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Transaksi Harian (Fact Table)</CardTitle>
          <CardDescription>Mencatat semua pergerakan barang secara detail.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Nilai (Rp)</TableHead>
                <TableHead className="text-center w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(item.transactionDate).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      {item.type === "IN" ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><ArrowDownLeft className="mr-1 h-3 w-3" /> Masuk</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><ArrowUpRight className="mr-1 h-3 w-3" /> Keluar</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col"><span className="font-medium">{item.product.name}</span><span className="text-xs text-muted-foreground">{item.product.category}</span></div>
                    </TableCell>
                    <TableCell>{item.supplier.name}</TableCell>
                    <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.amount.toLocaleString('id-ID')}</TableCell>
                    
                    {/* KOLOM AKSI: EDIT & DELETE */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <EditTransactionModal products={productList} existingData={item} />
                        <DeleteButton id={item.id} />
                      </div>
                    </TableCell>

                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={7} className="h-24 text-center">Belum ada transaksi.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </PermissionGuard>
  );
}
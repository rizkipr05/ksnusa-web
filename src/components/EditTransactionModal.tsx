"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { updateTransaction } from "@/app/actions";

// Menerima data transaksi lama (existingData) untuk ditampilkan di form
export function EditTransactionModal({ products, existingData }: { products: any[], existingData: any }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(existingData.quantity?.toString() || "");
  const [pricePerItem, setPricePerItem] = useState("");

  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(pricePerItem) || 0);

  async function handleSubmit(formData: FormData) {
    await updateTransaction(formData);
    setOpen(false);
    alert("Data berhasil diperbarui!");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaksi</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="id" value={existingData.id} />
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Produk</Label>
            <div className="col-span-3">
              <Select name="productId" defaultValue={existingData.productId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tipe</Label>
            <div className="col-span-3">
              <Select name="type" defaultValue={existingData.type}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Masuk</SelectItem>
                  <SelectItem value="OUT">Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Jumlah</Label>
            <Input
              name="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Harga/Item</Label>
            <Input
              name="pricePerItem"
              type="number"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Total</Label>
            <div className="col-span-3 p-2 bg-gray-50 rounded border text-right font-medium">
              Rp {totalAmount.toLocaleString('id-ID')}
            </div>
          </div>

          <DialogFooter><Button type="submit">Simpan Perubahan</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
// src/components/AddTransactionModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { createTransaction } from "@/app/actions"; // Panggil fungsi server tadi

export function AddTransactionModal({ products }: { products: any[] }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [pricePerItem, setPricePerItem] = useState("");

  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(pricePerItem) || 0);

  // Fungsi saat tombol "Simpan" ditekan
  async function handleSubmit(formData: FormData) {
    // Add the calculated total amount to the form data
    formData.append("amount", totalAmount.toString());
    await createTransaction(formData); // Kirim ke database
    setOpen(false); // Tutup popup
    alert("Transaksi Berhasil Disimpan!"); // Beri notifikasi
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Transaksi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Input Transaksi Baru</DialogTitle>
          <DialogDescription>
            Catat barang masuk (Restock) atau keluar (Penjualan) di sini.
          </DialogDescription>
        </DialogHeader>
        
        {/* FORMULIR */}
        <form action={handleSubmit} className="grid gap-4 py-4">
          
          {/* Pilih Produk */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right">Produk</Label>
            <div className="col-span-3">
              <Select name="productId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Barang..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pilih Tipe (Masuk/Keluar) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Tipe</Label>
            <div className="col-span-3">
              <Select name="type" required defaultValue="OUT">
                <SelectTrigger>
                  <SelectValue placeholder="Jenis Transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Barang Masuk (Restock)</SelectItem>
                  <SelectItem value="OUT">Barang Keluar (Terjual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Input Jumlah */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Jumlah</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              placeholder="Contoh: 5"
              className="col-span-3"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          {/* Input Harga per Item */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pricePerItem" className="text-right">Harga/Item</Label>
            <Input
              id="pricePerItem"
              type="number"
              min="0"
              placeholder="Contoh: 30000"
              className="col-span-3"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              required
            />
          </div>

          {/* Total Otomatis */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Total</Label>
            <div className="col-span-3 p-2 bg-gray-50 rounded border text-right font-medium">
              Rp {totalAmount.toLocaleString('id-ID')}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Simpan Data</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
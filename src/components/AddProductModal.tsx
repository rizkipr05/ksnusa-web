"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createProduct } from "@/app/actions";

export function AddProductModal({ suppliers }: { suppliers: any[] }) {
  const [open, setOpen] = useState(false);
  const [sku, setSku] = useState("");

  const generateRandomSKU = () => {
    const categories = ["OLI", "MSN", "KKK", "BDY", "ELK", "INT", "EXH", "SUS"];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newSku = `${randomCategory}-${randomNumber}`;
    setSku(newSku);
  };

  async function handleSubmit(formData: FormData) {
    // Override the SKU with our state value
    formData.set("sku", sku);
    await createProduct(formData);
    setOpen(false);
    setSku(""); // Reset for next use
    alert("Produk berhasil didaftarkan!");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Tambah Produk Baru</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daftarkan SKU Baru</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Kode SKU</Label>
            <div className="col-span-3 flex gap-2">
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Contoh: OLI-001"
                required
              />
              <Button type="button" variant="outline" onClick={generateRandomSKU}>
                Generate
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Nama Barang</Label>
            <Input name="name" placeholder="Contoh: Motul 5100" className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Kategori</Label>
            <div className="col-span-3">
              <Select name="category" required>
                <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oli">Oli</SelectItem>
                  <SelectItem value="Mesin">Mesin</SelectItem>
                  <SelectItem value="Kaki-kaki">Kaki-kaki</SelectItem>
                  <SelectItem value="Body">Body</SelectItem>
                  <SelectItem value="Elektrikal">Elektrikal</SelectItem>
                  <SelectItem value="Interior">Interior</SelectItem>
                  <SelectItem value="Exhaust">Exhaust</SelectItem>
                  <SelectItem value="Suspension">Suspension</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Supplier</Label>
            <div className="col-span-3">
              <Select name="supplierId" required>
                <SelectTrigger><SelectValue placeholder="Pilih Supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.length > 0 ? (
                    suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Belum ada supplier (Input dulu)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
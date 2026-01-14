"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { updateProduct } from "@/app/actions";

// Menerima data produk lama (existingData) untuk ditampilkan di form
export function EditProductModal({ suppliers, existingData }: { suppliers: any[], existingData: any }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await updateProduct(formData);
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
          <DialogTitle>Edit Produk</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="id" value={existingData.id} />

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">SKU</Label>
            <Input name="sku" type="text" defaultValue={existingData.sku} className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Nama</Label>
            <Input name="name" type="text" defaultValue={existingData.productName} className="col-span-3" required />
          </div>

          <input type="hidden" name="id" value={existingData.id} />

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Kategori</Label>
            <Input name="category" type="text" defaultValue={existingData.category} className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Supplier</Label>
            <div className="col-span-3">
              <Select name="supplierId" defaultValue={existingData.supplierId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter><Button type="submit">Simpan Perubahan</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

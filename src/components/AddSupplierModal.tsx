"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createSupplier } from "@/app/actions";

export function AddSupplierModal() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createSupplier(formData);
    setOpen(false);
    alert("Supplier berhasil ditambahkan!");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Tambah Supplier</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Input Supplier Baru</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Nama PT/CV</Label>
            <Input name="name" placeholder="Contoh: PT. Auto Part Jaya" className="col-span-3" required />
          </div>
          <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
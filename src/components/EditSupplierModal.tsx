"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { updateSupplier } from "@/app/actions";

interface EditSupplierModalProps {
  supplier: {
    id: string;
    name: string;
  };
}

export function EditSupplierModal({ supplier }: EditSupplierModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(supplier.name);

  async function handleSubmit(formData: FormData) {
    try {
      await updateSupplier(formData);
      setOpen(false);
      alert("Supplier berhasil diupdate!");
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Gagal mengupdate supplier");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="id" value={supplier.id} />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Nama PT/CV</Label>
            <Input 
              name="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: PT. Auto Part Jaya" 
              className="col-span-3" 
              required 
            />
          </div>
          <DialogFooter><Button type="submit">Simpan Perubahan</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTransaction } from "@/app/actions";
import { useTransition } from "react";
import { usePermission } from "@/hooks/usePermission";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { hasPermission, loading } = usePermission();

  if (loading || !hasPermission("orders_delete")) {
    return null;
  }

  const handleDelete = () => {
    if (confirm("Yakin hapus transaksi ini? Data stok akan berubah.")) {
      startTransition(async () => {
        await deleteTransaction(id);
      });
    }
  };

  return (
    <Button 
      variant="ghost" size="icon" onClick={handleDelete} disabled={isPending}
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

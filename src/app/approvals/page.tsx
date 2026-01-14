"use client";
import React, { useEffect, useState } from "react";
import SignatureCanvas from "@/components/SignatureCanvas";
import PermissionGuard from "@/components/PermissionGuard";

type Transaction = {
  id: string;
  transactionDate: string;
  type: string;
  quantity: number;
  amount: number;
  approvalStatus: string;
  product: { name: string; sku: string };
  supplier: { name: string };
};

export default function ApprovalsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    setToken(t);
    fetchPendingTransactions();
  }, []);

  async function fetchPendingTransactions() {
    try {
      const res = await fetch("/api/transactions/pending?status=PENDING");
      const data = await res.json();
      if (res.ok) setTransactions(data.transactions || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleApprove(decision: "APPROVED" | "REJECTED") {
    if (!selectedId) return;
    setMessage("");
    try {
      const res = await fetch("/api/transactions/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          factId: selectedId,
          decision,
          signatureBase64: decision === "APPROVED" ? signature : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval gagal");
      setMessage(`Transaksi ${decision === "APPROVED" ? "disetujui" : "ditolak"} ✓`);
      setSelectedId(null);
      setSignature(null);
      fetchPendingTransactions();
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
  }

  return (
    <PermissionGuard requiredPermission="approvals_view">
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Approval Barang Masuk</h1>
      {message && (
        <div className={`p-3 rounded ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}

      <div className="bg-white border rounded p-4">
        <h2 className="font-medium mb-3">Transaksi Pending Approval</h2>
        
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">Tidak ada transaksi yang menunggu approval.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {transactions.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${selectedId === t.id ? "border-blue-500 bg-blue-50" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{t.product.name} ({t.product.sku})</div>
                    <div className="text-sm text-gray-600">
                      Supplier: {t.supplier.name} • Qty: {t.quantity} • Amount: Rp {t.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(t.transactionDate).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    {t.approvalStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedId && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tanda Tangan (wajib untuk APPROVED)</label>
              <SignatureCanvas onSignatureChange={setSignature} width={500} height={150} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove("APPROVED")}
                disabled={!signature}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Setujui (APPROVED)
              </button>
              <button
                onClick={() => handleApprove("REJECTED")}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Tolak (REJECTED)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGuard>
  );
}

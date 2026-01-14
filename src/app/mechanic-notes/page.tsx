"use client";
import React, { useEffect, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";

type Note = {
  id: string;
  content: string;
  createdAt: string;
  createdBy: { name: string; email: string };
  serviceOrder: { 
    orderNumber: string;
    customerName: string; 
    serviceType: string;
    scheduledDate: string;
  };
};

type ServiceOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicleInfo: string;
  serviceType: string;
  status: string;
  scheduledDate: string;
};

export default function MechanicNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [content, setContent] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    setToken(t);
    if (t) {
      fetchNotes(t);
      fetchServiceOrders(t);
    }
  }, []);

  async function fetchNotes(t: string) {
    try {
      const res = await fetch("/api/mechanic-notes", {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      const data = await res.json();
      if (res.ok) setNotes(data.notes || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchServiceOrders(t: string) {
    try {
      const res = await fetch("/api/service-orders", {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      const data = await res.json();
      if (res.ok) setServiceOrders(data.serviceOrders || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!serviceOrderId || !content) {
      setMessage("Error: Order servis dan catatan wajib diisi");
      return;
    }
    try {
      const res = await fetch("/api/mechanic-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ serviceOrderId, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan catatan");
      setMessage("Catatan berhasil disimpan ✓");
      setServiceOrderId("");
      setContent("");
      fetchNotes(token);
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
  }

  return (
    <PermissionGuard requiredPermission="mechanic_notes_view">
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Catatan Mekanik</h1>

      {message && (
        <div className={`p-3 rounded ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}

      <div className="bg-white border rounded p-4">
        <h2 className="font-medium mb-3">Tambah Catatan Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Order Servis</label>
            <select
              className="w-full border rounded px-3 py-2 mt-1"
              value={serviceOrderId}
              onChange={(e) => setServiceOrderId(e.target.value)}
            >
              <option value="">-- Pilih Order Servis --</option>
              {serviceOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customerName} ({order.serviceType}) - {new Date(order.scheduledDate).toLocaleDateString("id-ID")}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Pilih order servis/perbaikan yang akan diberi catatan
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Catatan Perbaikan/Informasi</label>
            <textarea
              className="w-full border rounded px-3 py-2 mt-1"
              rows={4}
              placeholder="Contoh: Ganti oli mesin, servis berkala 5000km, perbaikan rem belakang..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Simpan Catatan
          </button>
        </form>
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-medium mb-3">Riwayat Catatan</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada catatan.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border-b pb-3 last:border-b-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-sm">
                    {note.createdBy.name || note.createdBy.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  Order: {note.serviceOrder.orderNumber} - {note.serviceOrder.customerName} ({note.serviceOrder.serviceType})
                </div>
                <div className="text-sm text-gray-700">{note.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </PermissionGuard>
  );
}

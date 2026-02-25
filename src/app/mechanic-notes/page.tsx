"use client";
import React, { useEffect, useRef, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";

type Note = {
  id: string;
  content: string;
  partType?: string | null;
  partsUsed?: string | null;
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

type LiveUpdate = {
  id: string;
  serviceOrderId: string;
  orderNumber: string;
  customerName: string;
  updateType: "BEFORE" | "PROGRESS" | "AFTER";
  mediaType: "IMAGE" | "VIDEO" | null;
  mediaUrl: string | null;
  caption: string | null;
  directNote: string | null;
  createdAt: string;
  mechanicName: string | null;
  mechanicEmail: string;
};

export default function MechanicNotesPage() {
  const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Terjadi kesalahan");
  const [notes, setNotes] = useState<Note[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [content, setContent] = useState("");
  const [partType, setPartType] = useState("UNKNOWN");
  const [partsUsed, setPartsUsed] = useState("");
  const [liveServiceOrderId, setLiveServiceOrderId] = useState("");
  const [updateType, setUpdateType] = useState("PROGRESS");
  const [mediaType, setMediaType] = useState("IMAGE");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [directNote, setDirectNote] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    setToken(t);
    if (t) {
      fetchNotes(t);
      fetchServiceOrders(t);
      fetchLiveUpdates(t);
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

  async function fetchLiveUpdates(t: string, currentServiceOrderId?: string) {
    try {
      const query = currentServiceOrderId
        ? `?serviceOrderId=${encodeURIComponent(currentServiceOrderId)}`
        : "";
      const res = await fetch(`/api/service-live-updates${query}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (res.ok) setLiveUpdates(data.updates || []);
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
        body: JSON.stringify({ serviceOrderId, content, partType, partsUsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan catatan");
      setMessage("Catatan berhasil disimpan ✓");
      setServiceOrderId("");
      setContent("");
      setPartType("UNKNOWN");
      setPartsUsed("");
      fetchNotes(token);
    } catch (error: unknown) {
      setMessage("Error: " + getErrorMessage(error));
    }
  }

  async function handleSubmitLiveUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!liveServiceOrderId || !updateType) {
      setMessage("Error: Order servis dan tipe update wajib diisi");
      return;
    }
    if (!directNote.trim() && !mediaUrl.trim() && !mediaFile) {
      setMessage("Error: Isi direct note, media URL, atau upload file");
      return;
    }

    try {
      setUploading(true);
      let finalMediaUrl = mediaUrl.trim();
      let finalMediaType = mediaType;

      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);
        const uploadRes = await fetch("/api/uploads/service-media", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload media");
        finalMediaUrl = uploadData.url;
        finalMediaType = uploadData.mediaType || finalMediaType;
      }

      const res = await fetch("/api/service-live-updates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceOrderId: liveServiceOrderId,
          updateType,
          mediaType: finalMediaType || null,
          mediaUrl: finalMediaUrl || null,
          caption,
          directNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan live update");
      setMessage("Live status berhasil dikirim ke customer ✓");
      setLiveServiceOrderId("");
      setUpdateType("PROGRESS");
      setMediaType("IMAGE");
      setMediaUrl("");
      setMediaFile(null);
      setCaption("");
      setDirectNote("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchLiveUpdates(token);
    } catch (error: unknown) {
      setMessage("Error: " + getErrorMessage(error));
    } finally {
      setUploading(false);
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
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Tipe Part</label>
              <select
                className="w-full border rounded px-3 py-2 mt-1"
                value={partType}
                onChange={(e) => setPartType(e.target.value)}
              >
                <option value="UNKNOWN">Belum diketahui</option>
                <option value="ORIGINAL">Original</option>
                <option value="AFTERMARKET">Aftermarket</option>
                <option value="MIXED">Campuran</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Part Digunakan</label>
              <input
                className="w-full border rounded px-3 py-2 mt-1"
                placeholder="Contoh: Oli Yamalube, Kampas Rem"
                value={partsUsed}
                onChange={(e) => setPartsUsed(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Pisahkan dengan koma.</p>
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Simpan Catatan
          </button>
        </form>
      </div>

      <div className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-medium">Transparansi & Edukasi Customer</h2>
        <p className="text-xs text-gray-500">
          Kirim live status (before/progress/after) dan direct note mekanik agar customer tahu progres servis.
        </p>
        <form onSubmit={handleSubmitLiveUpdate} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Order Servis</label>
            <select
              className="w-full border rounded px-3 py-2 mt-1"
              value={liveServiceOrderId}
              onChange={(e) => setLiveServiceOrderId(e.target.value)}
            >
              <option value="">-- Pilih Order Servis --</option>
              {serviceOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customerName} ({order.serviceType})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Tipe Update</label>
              <select
                className="w-full border rounded px-3 py-2 mt-1"
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value)}
              >
                <option value="BEFORE">Before Service</option>
                <option value="PROGRESS">On Progress</option>
                <option value="AFTER">After Service</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Media Type</label>
              <select
                className="w-full border rounded px-3 py-2 mt-1"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
              >
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Upload Media (foto/video)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="w-full border rounded px-3 py-2 mt-1 text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setMediaFile(file);
                  if (file?.type.startsWith("video/")) setMediaType("VIDEO");
                  else if (file?.type.startsWith("image/")) setMediaType("IMAGE");
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Gambar maks 10MB, video maks 60MB.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Atau Media URL (opsional)</label>
              <input
                className="w-full border rounded px-3 py-2 mt-1"
                placeholder="https://..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Caption Media</label>
            <input
              className="w-full border rounded px-3 py-2 mt-1"
              placeholder="Contoh: Kondisi kampas rem sebelum penggantian"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Direct Mechanic Note</label>
            <textarea
              className="w-full border rounded px-3 py-2 mt-1"
              rows={3}
              placeholder="Pesan khusus mekanik untuk customer..."
              value={directNote}
              onChange={(e) => setDirectNote(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            {uploading ? "Mengunggah..." : "Kirim Live Update"}
          </button>
        </form>
      </div>

      <div className="bg-white border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Timeline Live Status</h2>
          <button
            className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
            onClick={() => fetchLiveUpdates(token, liveServiceOrderId || undefined)}
            type="button"
          >
            Refresh
          </button>
        </div>
        {!liveUpdates.length ? (
          <p className="text-sm text-gray-500">Belum ada live status.</p>
        ) : (
          <div className="space-y-3">
            {liveUpdates.map((update) => (
              <div key={update.id} className="border rounded p-3 space-y-1">
                <div className="text-xs text-gray-500">
                  {update.orderNumber} • {update.customerName} • {update.updateType} •{" "}
                  {new Date(update.createdAt).toLocaleString("id-ID")}
                </div>
                {update.mediaUrl && (
                  <div className="text-xs">
                    <a className="text-blue-600 hover:underline" href={update.mediaUrl} target="_blank" rel="noreferrer">
                      Lihat media ({update.mediaType || "FILE"})
                    </a>
                    {update.caption ? <span className="text-gray-500"> - {update.caption}</span> : null}
                  </div>
                )}
                {update.directNote ? (
                  <div className="text-sm text-gray-700">{update.directNote}</div>
                ) : null}
                <div className="text-xs text-gray-500">
                  Mekanik: {update.mechanicName || update.mechanicEmail}
                </div>
              </div>
            ))}
          </div>
        )}
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
                <div className="text-xs text-gray-500 mt-1">
                  Tipe part: {note.partType || "UNKNOWN"} | Part: {note.partsUsed || "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </PermissionGuard>
  );
}

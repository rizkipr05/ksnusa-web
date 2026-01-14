"use client";
import React, { useEffect, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";

type UserProfile = {
  id: string;
  name?: string | null;
  email: string;
  role: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        throw new Error(data?.error || "Gagal memuat profil");
      }
      setProfile(data.user);
      setName(data.user?.name || "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        throw new Error(data?.error || "Gagal menyimpan profil");
      }
      setNotice("Profil berhasil diperbarui.");
      setCurrentPassword("");
      setNewPassword("");
      setProfile(data.user);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <PermissionGuard requiredPermission="dashboard_view">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Profil</h1>
          <p className="text-sm text-gray-500">Kelola informasi akun dan ubah password.</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {notice && <div className="text-sm text-green-600">{notice}</div>}

        {loading && <div className="text-sm text-gray-500">Memuat profil...</div>}

        {!loading && profile && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="bg-white border rounded p-4 space-y-3">
              <h2 className="font-semibold">Info Akun</h2>
              <div className="text-sm text-gray-600">
                <div>Email: {profile.email}</div>
                <div>Role: {profile.role}</div>
              </div>
              <form onSubmit={onSave} className="space-y-3">
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Nama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <button className="w-full bg-black text-white rounded py-2 text-sm">Simpan Profil</button>
              </form>
            </div>

            <div className="bg-white border rounded p-4 space-y-3">
              <h2 className="font-semibold">Ubah Password</h2>
              <form onSubmit={onSave} className="space-y-3">
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Password saat ini"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Password baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button className="w-full bg-black text-white rounded py-2 text-sm">Ubah Password</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

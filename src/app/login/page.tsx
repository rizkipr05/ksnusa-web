"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login gagal");
      // Simpan token juga di localStorage (cookie HttpOnly juga sudah diset oleh server)
      if (data.token) localStorage.setItem("token", data.token);
      window.location.href = "/dashboard";
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border rounded p-6 space-y-4">
        <h1 className="text-xl font-semibold">Login</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input className="w-full border rounded px-2 py-1" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input type="password" className="w-full border rounded px-2 py-1" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <button className="w-full bg-black text-white rounded py-2">Masuk</button>
        <div className="text-xs text-gray-500">Coba: owner@example.com / ownerpass</div>
        <div className="text-xs text-gray-600">
          Belum punya akun? <Link className="underline" href="/register">Daftar</Link>
        </div>
      </form>
    </div>
  );
}

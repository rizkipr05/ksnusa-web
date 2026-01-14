// src/app/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <html lang="id">
      <body className={inter.className}>
        {isAuthPage ? (
          // Auth pages: tanpa sidebar, fullscreen
          <div className="min-h-screen w-full bg-gray-100">
            {children}
          </div>
        ) : (
          // Halaman lain: dengan sidebar
          <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
              <Sidebar />
            </aside>
            <main className="flex-1 md:ml-64 h-full relative overflow-y-auto">
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        )}
      </body>
    </html>
  );
}

"use client";

import { usePathname } from "next/navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <main className={`flex-1 overflow-y-auto p-6 transition-colors ${
      isAdmin ? "bg-gradient-to-br from-[#fffcf5] via-[#fdf6e9] to-[#faf0db] bg-dots" : ""
    }`}>
      {children}
    </main>
  );
}

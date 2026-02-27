"use client";

import { usePathname } from "next/navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <main className={`flex-1 overflow-y-auto p-6 transition-colors ${
      isAdmin ? "bg-[#fffcf5]" : ""
    }`}>
      {children}
    </main>
  );
}

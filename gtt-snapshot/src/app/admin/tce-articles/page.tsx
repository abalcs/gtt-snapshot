import { requireAdmin } from "@/lib/admin-auth";
import { TceManagement } from "./tce-management";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TceArticlesAdminPage() {
  await requireAdmin();
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#3a5f54] via-[#2d5246] to-[#1e3830] px-8 py-6 shadow-[var(--shadow-md)]">
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Manage TCE Articles</h1>
            <p className="text-white/70">Travel Center of Excellence knowledge base</p>
          </div>
          <Link href="/admin">
            <button className="inline-flex items-center justify-center rounded-md bg-white/90 hover:bg-white border border-white/30 px-4 py-2 text-sm font-medium text-[#1e3830] transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
      <TceManagement />
    </div>
  );
}

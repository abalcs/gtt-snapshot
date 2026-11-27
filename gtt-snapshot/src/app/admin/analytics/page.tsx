import { requireAdmin } from "@/lib/admin-auth";
import { AnalyticsDashboard } from "./analytics-dashboard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdmin();

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0d4256] via-[#0e4d5c] to-[#07222b] px-8 py-6 shadow-[var(--shadow-md)]">
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a227]">Administration</p>
            <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-white">Analytics</h1>
            <p className="mt-1 text-white/70">Usage insights and activity tracking</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-md bg-white/90 hover:bg-white border border-white/30 px-4 py-2 text-sm font-medium text-[#07222b] transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}

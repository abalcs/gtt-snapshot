import { requireAdmin } from "@/lib/admin-auth";
import { getAllTravelData } from "@/lib/travel-data-queries";
import { TravelDataManagement } from "./travel-data-management";

export const dynamic = "force-dynamic";

export default async function TravelDataPage() {
  await requireAdmin();
  const travelData = await getAllTravelData();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0d4256] via-[#0e4d5c] to-[#07222b] px-8 py-6 shadow-[var(--shadow-md)]">
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a227]">Administration</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-white">Travel Data</h1>
          <p className="text-white/70">Sync travel advisories, visa requirements, and health data</p>
        </div>
      </div>
      <TravelDataManagement initialData={travelData} />
    </div>
  );
}

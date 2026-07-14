import { requireAdmin } from "@/lib/admin-auth";
import { getAllTravelData } from "@/lib/travel-data-queries";
import { TravelDataManagement } from "./travel-data-management";

export const dynamic = "force-dynamic";

export default async function TravelDataPage() {
  await requireAdmin();
  const travelData = await getAllTravelData();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 px-8 py-6 shadow-[var(--shadow-md)]">
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight text-white">Travel Data</h1>
          <p className="text-amber-100">Sync travel advisories, visa requirements, and health data</p>
        </div>
      </div>
      <TravelDataManagement initialData={travelData} />
    </div>
  );
}

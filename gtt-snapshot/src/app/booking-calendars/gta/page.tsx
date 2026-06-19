import Link from "next/link";
import { requireAuth } from "@/lib/admin-auth";
import { getConsultantsByTitle } from "@/lib/booking-calendars";
import { invalidateCache } from "@/lib/data-cache";
import { GtaClient } from "./gta-client";

export const dynamic = "force-dynamic";

export default async function GtaPage() {
  await requireAuth();
  invalidateCache("consultants");
  const consultants = await getConsultantsByTitle("GTA");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/booking-calendars" className="hover:underline">Booking Calendars</Link>
          <span>/</span>
          <span>GTA Calendars</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">GTA Calendars</h1>
      </div>

      <GtaClient consultants={consultants} />
    </div>
  );
}

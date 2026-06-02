import Link from "next/link";
import { requireAuth } from "@/lib/admin-auth";
import { getConsultantsByRegion, getTaRanksByConsultant, getDisabledBookingDestinations } from "@/lib/booking-calendars";
import { invalidateCache } from "@/lib/data-cache";
import { BookingCalendarsClient } from "./booking-calendars-client";

export const dynamic = "force-dynamic";

export default async function BookingCalendarsPage() {
  const user = await requireAuth();
  invalidateCache("consultants");
  const [regions, taRanks, disabledDests] = await Promise.all([
    getConsultantsByRegion(),
    getTaRanksByConsultant(),
    user.role === "admin" ? getDisabledBookingDestinations() : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span>Booking Calendars</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Booking Calendars</h1>
      </div>

      <BookingCalendarsClient regions={regions} taRanks={taRanks} isAdmin={user.role === "admin"} disabledDestinations={disabledDests} />
    </div>
  );
}

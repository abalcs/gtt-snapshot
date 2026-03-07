import Link from "next/link";
import { requireAuth } from "@/lib/admin-auth";
import { getConsultantsByRegion } from "@/lib/booking-calendars";
import { BookingCalendarsClient } from "./booking-calendars-client";

export const dynamic = "force-dynamic";

export default async function BookingCalendarsPage() {
  await requireAuth();
  const regions = await getConsultantsByRegion();

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

      <BookingCalendarsClient regions={regions} />
    </div>
  );
}

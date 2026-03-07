import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/admin-auth";
import { getConsultantsByRegion } from "@/lib/booking-calendars";

export const dynamic = "force-dynamic";

export default async function BookingCalendarsPage() {
  await requireAuth();
  const regions = getConsultantsByRegion();

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

      {regions.map(({ region, consultants }) => (
        <section key={region}>
          <h2 className="text-xl font-semibold mb-4">{region}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {consultants.map((consultant) => (
              <Card key={`${consultant.name}-${region}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="font-medium">{consultant.name}</p>
                      {consultant.title && (
                        <p className="text-sm text-muted-foreground">{consultant.title}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{consultant.countriesDisplay}</p>
                    </div>
                    {consultant.calendarUrl ? (
                      <a
                        href={consultant.calendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md bg-[#3a5f54] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors"
                      >
                        Book a Call
                      </a>
                    ) : (
                      <Badge variant="secondary" className="w-fit">No Calendar</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

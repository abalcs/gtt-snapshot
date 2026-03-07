import type { Consultant } from "@/lib/booking-calendars";

export function CountrySpecialists({ consultants }: { consultants: Consultant[] }) {
  if (consultants.length === 0) return null;

  return (
    <div className="space-y-3">
      {consultants.map((consultant) => (
        <div
          key={consultant.name}
          className="flex items-center justify-between gap-4 rounded-md border p-3"
        >
          <div>
            <p className="font-medium text-sm">{consultant.name}</p>
            {consultant.title && (
              <p className="text-xs text-muted-foreground">{consultant.title}</p>
            )}
          </div>
          <a
            href={consultant.calendarUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-[#3a5f54] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors shrink-0"
          >
            Book a Call
          </a>
        </div>
      ))}
    </div>
  );
}

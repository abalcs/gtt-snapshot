"use client";

import { useState } from "react";
import type { Consultant } from "@/lib/booking-calendars";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CountrySpecialists({ consultants }: { consultants: Consultant[] }) {
  const [calendarModal, setCalendarModal] = useState<{ url: string; name: string } | null>(null);

  if (consultants.length === 0) return null;

  return (
    <>
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
            <button
              onClick={() => setCalendarModal({ url: consultant.calendarUrl!, name: consultant.name })}
              className="inline-flex items-center rounded-md bg-[#3a5f54] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors shrink-0"
            >
              Book a Call
            </button>
          </div>
        ))}
      </div>

      <Dialog open={!!calendarModal} onOpenChange={(open) => !open && setCalendarModal(null)}>
        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>Book a Call — {calendarModal?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6 min-h-0">
            {calendarModal && (
              <iframe
                src={calendarModal.url}
                className="w-full h-full rounded-md border"
                title={`Booking calendar for ${calendarModal.name}`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Consultant } from "@/lib/booking-calendars";

function consultantKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface RegionGroup {
  region: string;
  consultants: Consultant[];
}

export function BookingCalendarsClient({ regions }: { regions: RegionGroup[] }) {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [calendarModal, setCalendarModal] = useState<{ url: string; name: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/booking-clicks")
      .then((r) => r.json())
      .then((data) => setClickCounts(data))
      .catch(() => {});
  }, []);

  const handleCloseAttempt = () => {
    setShowConfirm(true);
  };

  const handleConfirmYes = () => {
    if (calendarModal) {
      const name = calendarModal.name;
      fetch("/api/booking-clicks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultantName: name }),
      }).catch(() => {});
      setClickCounts((prev) => {
        const key = consultantKey(name);
        return { ...prev, [key]: (prev[key] ?? 0) + 1 };
      });
    }
    setShowConfirm(false);
    setCalendarModal(null);
  };

  const handleConfirmNo = () => {
    setShowConfirm(false);
    setCalendarModal(null);
  };

  const handleBack = () => {
    setShowConfirm(false);
  };

  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  return (
    <>
      <div className="space-y-4">
        {regions.map(({ region, consultants }) => (
          <section key={region} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleRegion(region)}
              className="flex w-full items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
            >
              <h2 className="text-lg font-semibold">{region}</h2>
              <span className="flex items-center gap-2 text-muted-foreground text-sm">
                <span>{consultants.length} specialists</span>
                <span
                  className={cn(
                    "transition-transform duration-200 inline-block text-base",
                    expandedRegions.has(region) && "rotate-90"
                  )}
                >
                  ›
                </span>
              </span>
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                expandedRegions.has(region)
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {consultants.map((consultant) => {
                    const count = clickCounts[consultantKey(consultant.name)] ?? 0;
                    return (
                      <Card key={`${consultant.name}-${region}`}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex flex-col gap-2">
                            <div>
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{consultant.name}</p>
                                {count > 0 && (
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {count} {count === 1 ? "booking" : "bookings"} (30d)
                                  </Badge>
                                )}
                              </div>
                              {consultant.title && (
                                <p className="text-sm text-muted-foreground">{consultant.title}</p>
                              )}
                              <p className="text-sm text-muted-foreground mt-1">{consultant.countriesDisplay}</p>
                            </div>
                            {consultant.calendarUrl ? (
                              consultant.calendarUrl.includes("/bookwithme/") ? (
                                <a
                                  href={consultant.calendarUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center rounded-md bg-[#3a5f54] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors gap-1.5"
                                >
                                  Book a Call
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                </a>
                              ) : (
                                <button
                                  onClick={() => setCalendarModal({ url: consultant.calendarUrl!, name: consultant.name })}
                                  className="inline-flex items-center justify-center rounded-md bg-[#3a5f54] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors"
                                >
                                  Book a Call
                                </button>
                              )
                            ) : (
                              <Badge variant="secondary" className="w-fit">No Calendar</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <Dialog
        open={!!calendarModal}
        onOpenChange={(open) => { if (!open) handleCloseAttempt(); }}
      >
        <DialogContent
          className="sm:max-w-4xl h-[85vh] flex flex-col p-0"
          showCloseButton={false}
          onPointerDownOutside={(e) => { e.preventDefault(); handleCloseAttempt(); }}
          onEscapeKeyDown={(e) => { e.preventDefault(); handleCloseAttempt(); }}
        >
          {showConfirm ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
              <p className="text-lg font-semibold text-center">Did you book a call with {calendarModal?.name}?</p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmYes}
                  className="inline-flex items-center justify-center rounded-md bg-[#3a5f54] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={handleConfirmNo}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleBack}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="px-6 pt-6 pb-0 flex flex-row items-center justify-between">
                <DialogTitle>Book a Call — {calendarModal?.name}</DialogTitle>
                <button
                  onClick={handleCloseAttempt}
                  className="rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  <span className="sr-only">Close</span>
                </button>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

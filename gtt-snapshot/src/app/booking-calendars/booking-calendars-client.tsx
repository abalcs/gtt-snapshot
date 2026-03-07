"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/booking-clicks")
      .then((r) => r.json())
      .then((data) => setClickCounts(data))
      .catch(() => {});
  }, []);

  const handleBookClick = useCallback((consultant: Consultant) => {
    setCalendarModal({ url: consultant.calendarUrl!, name: consultant.name });
    fetch("/api/booking-clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultantName: consultant.name }),
    })
      .then(() => {
        setClickCounts((prev) => {
          const key = consultantKey(consultant.name);
          return { ...prev, [key]: (prev[key] ?? 0) + 1 };
        });
      })
      .catch(() => {});
  }, []);

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
                              <button
                                onClick={() => handleBookClick(consultant)}
                                className="inline-flex items-center justify-center rounded-md bg-[#3a5f54] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors"
                              >
                                Book a Call
                              </button>
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

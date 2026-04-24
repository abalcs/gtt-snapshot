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
import type { CountryAgentGroup } from "@/lib/booking-calendars";

function consultantKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function TravelAgentsClient({ countryGroups }: { countryGroups: CountryAgentGroup[] }) {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [calendarModal, setCalendarModal] = useState<{ url: string; name: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [externalConfirm, setExternalConfirm] = useState<{ name: string } | null>(null);
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

  const handleExternalBookClick = (url: string, name: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setExternalConfirm({ name });
  };

  const handleExternalYes = () => {
    if (externalConfirm) {
      const name = externalConfirm.name;
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
    setExternalConfirm(null);
  };

  const handleExternalNo = () => {
    setExternalConfirm(null);
  };

  const toggleCountry = (country: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(country)) next.delete(country);
      else next.add(country);
      return next;
    });
  };

  return (
    <>
      <div className="space-y-4">
        {countryGroups.map(({ country, agents }) => (
          <section key={country} className="border rounded-lg overflow-hidden shadow-[var(--shadow-sm)]">
            <button
              onClick={() => toggleCountry(country)}
              className="flex w-full items-center justify-between px-4 py-3 bg-gradient-to-r from-[#f0f5f2] to-[#e8f0ec] border-l-4 border-l-[#3a5f54] hover:from-[#e8f0ec] hover:to-[#dde9e3] transition-colors"
            >
              <h2 className="text-lg font-semibold">{country}</h2>
              <span className="flex items-center gap-2 text-muted-foreground text-sm">
                <span>{agents.length} agents</span>
                <span
                  className={cn(
                    "transition-transform duration-200 inline-block text-base",
                    expandedCountries.has(country) && "rotate-90"
                  )}
                >
                  ›
                </span>
              </span>
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                expandedCountries.has(country)
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {agents.map((agent, idx) => {
                    const count = agent.consultant
                      ? clickCounts[consultantKey(agent.consultant.name)] ?? 0
                      : 0;

                    return (
                      <Card key={`${country}-${agent.taLabel}-${idx}`}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex flex-col gap-2">
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3a5f54]/10 text-[#3a5f54] text-xs font-semibold shrink-0">
                                    {(agent.name)
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <p className="font-medium">
                                    {agent.name}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs shrink-0 font-semibold"
                                >
                                  {agent.taLabel}
                                </Badge>
                              </div>
                              {agent.consultant?.title && (
                                <p className="text-sm text-muted-foreground ml-10">
                                  {agent.consultant.title}
                                </p>
                              )}
                              {count > 0 && (
                                <div className="ml-10 mt-0.5">
                                  <Badge variant="outline" className="text-xs">
                                    {count} {count === 1 ? "booking" : "bookings"} (30d)
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {agent.consultant ? (
                              agent.consultant.calendarUrl ? (
                                agent.consultant.calendarUrl.includes("/bookwithme/") ? (
                                  <button
                                    onClick={() =>
                                      handleExternalBookClick(
                                        agent.consultant!.calendarUrl!,
                                        agent.consultant!.name
                                      )
                                    }
                                    className="inline-flex items-center justify-center rounded-md bg-gradient-to-b from-[#3a5f54] to-[#2a4a40] px-4 py-2 text-sm font-medium text-white hover:from-[#2a4a40] hover:to-[#1e3830] transition-all shadow-[var(--shadow-sm)] active:translate-y-px gap-1.5"
                                  >
                                    Book a Call
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setCalendarModal({
                                        url: agent.consultant!.calendarUrl!,
                                        name: agent.consultant!.name,
                                      })
                                    }
                                    className="inline-flex items-center justify-center rounded-md bg-gradient-to-b from-[#3a5f54] to-[#2a4a40] px-4 py-2 text-sm font-medium text-white hover:from-[#2a4a40] hover:to-[#1e3830] transition-all shadow-[var(--shadow-sm)] active:translate-y-px"
                                  >
                                    Book a Call
                                  </button>
                                )
                              ) : (
                                <Badge variant="secondary" className="w-fit">
                                  No Calendar
                                </Badge>
                              )
                            ) : (
                              <Badge className="w-fit bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                Call for Live Transfer
                              </Badge>
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

      {/* Calendar iframe modal */}
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

      {/* External booking confirmation */}
      <Dialog open={!!externalConfirm} onOpenChange={(open) => { if (!open) setExternalConfirm(null); }}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-6 py-4">
            <p className="text-lg font-semibold text-center">Did you book a call with {externalConfirm?.name}?</p>
            <div className="flex gap-3">
              <button
                onClick={handleExternalYes}
                className="inline-flex items-center justify-center rounded-md bg-[#3a5f54] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors"
              >
                Yes
              </button>
              <button
                onClick={handleExternalNo}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

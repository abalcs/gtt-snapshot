"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Consultant } from "@/lib/booking-calendars";

function consultantKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function TamClient({ consultants }: { consultants: Consultant[] }) {
  const [calendarModal, setCalendarModal] = useState<{ url: string; name: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [externalConfirm, setExternalConfirm] = useState<{ name: string } | null>(null);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  const handleCloseAttempt = () => setShowConfirm(true);

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

  const handleConfirmNo = () => { setShowConfirm(false); setCalendarModal(null); };
  const handleBack = () => setShowConfirm(false);

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

  const handleExternalNo = () => setExternalConfirm(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {consultants.map((consultant) => {
          const count = clickCounts[consultantKey(consultant.name)] ?? 0;
          return (
            <Card key={consultant.name}>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3a5f54]/10 text-[#3a5f54] text-xs font-semibold shrink-0">
                          {consultant.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <p className="font-medium">{consultant.name}</p>
                      </div>
                      {count > 0 && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {count} {count === 1 ? "booking" : "bookings"} (30d)
                        </Badge>
                      )}
                    </div>
                    {consultant.countriesDisplay && (
                      <p className="text-sm text-muted-foreground mt-1">{consultant.countriesDisplay}</p>
                    )}
                  </div>
                  {consultant.calendarUrl ? (
                    consultant.calendarUrl.includes("/bookwithme/") ? (
                      <button
                        onClick={() => handleExternalBookClick(consultant.calendarUrl!, consultant.name)}
                        className="inline-flex items-center justify-center rounded-md bg-gradient-to-b from-[#3a5f54] to-[#2a4a40] px-4 py-2 text-sm font-medium text-white hover:from-[#2a4a40] hover:to-[#1e3830] transition-all shadow-[var(--shadow-sm)] active:translate-y-px gap-1.5"
                      >
                        Book a Call
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => setCalendarModal({ url: consultant.calendarUrl!, name: consultant.name })}
                        className="inline-flex items-center justify-center rounded-md bg-gradient-to-b from-[#3a5f54] to-[#2a4a40] px-4 py-2 text-sm font-medium text-white hover:from-[#2a4a40] hover:to-[#1e3830] transition-all shadow-[var(--shadow-sm)] active:translate-y-px"
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

      {/* Calendar iframe modal */}
      <Dialog open={!!calendarModal} onOpenChange={(open) => { if (!open) handleCloseAttempt(); }}>
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
                <button onClick={handleConfirmYes} className="inline-flex items-center justify-center rounded-md bg-[#3a5f54] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors">Yes</button>
                <button onClick={handleConfirmNo} className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors">No</button>
                <button onClick={handleBack} className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">Go Back</button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="px-6 pt-6 pb-0 flex flex-row items-center justify-between">
                <DialogTitle>Book a Call — {calendarModal?.name}</DialogTitle>
                <button onClick={handleCloseAttempt} className="rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  <span className="sr-only">Close</span>
                </button>
              </DialogHeader>
              <div className="flex-1 px-6 pb-6 min-h-0">
                {calendarModal && (
                  <iframe src={calendarModal.url} className="w-full h-full rounded-md border" title={`Booking calendar for ${calendarModal.name}`} />
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
              <button onClick={handleExternalYes} className="inline-flex items-center justify-center rounded-md bg-[#3a5f54] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors">Yes</button>
              <button onClick={handleExternalNo} className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors">No</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

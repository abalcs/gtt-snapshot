"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { Consultant } from "@/lib/booking-calendars";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function consultantKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function CountrySpecialists({ consultants }: { consultants: Consultant[] }) {
  const [calendarModal, setCalendarModal] = useState<{ url: string; name: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [externalConfirm, setExternalConfirm] = useState<{ name: string; url: string } | null>(null);
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
    setExternalConfirm({ name, url });
  };

  const [showExternalConfirm, setShowExternalConfirm] = useState(false);

  const handleExternalCloseAttempt = () => {
    setShowExternalConfirm(true);
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
    setShowExternalConfirm(false);
    setExternalConfirm(null);
  };

  const handleExternalNo = () => {
    setShowExternalConfirm(false);
    setExternalConfirm(null);
  };

  const handleExternalBack = () => {
    setShowExternalConfirm(false);
  };

  if (consultants.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        {consultants.map((consultant) => {
          const count = clickCounts[consultantKey(consultant.name)] ?? 0;
          return (
            <div
              key={consultant.name}
              className="flex items-center justify-between gap-4 rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-sm">{consultant.name}</p>
                  {consultant.title && (
                    <p className="text-xs text-muted-foreground">{consultant.title}</p>
                  )}
                </div>
                {count > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {count} {count === 1 ? "booking" : "bookings"} (30d)
                  </Badge>
                )}
              </div>
              {consultant.calendarUrl!.includes("/bookwithme/") ? (
                <button
                  onClick={() => handleExternalBookClick(consultant.calendarUrl!, consultant.name)}
                  className="inline-flex items-center rounded-md bg-[#3a5f54] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors shrink-0"
                >
                  Book a Call
                </button>
              ) : (
                <button
                  onClick={() => setCalendarModal({ url: consultant.calendarUrl!, name: consultant.name })}
                  className="inline-flex items-center rounded-md bg-[#3a5f54] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2a4a40] transition-colors shrink-0"
                >
                  Book a Call
                </button>
              )}
            </div>
          );
        })}
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

      <Dialog
        open={!!externalConfirm}
        onOpenChange={(open) => { if (!open) handleExternalCloseAttempt(); }}
      >
        <DialogContent
          className="sm:max-w-4xl h-[85vh] flex flex-col p-0"
          showCloseButton={false}
          onPointerDownOutside={(e) => { e.preventDefault(); handleExternalCloseAttempt(); }}
          onEscapeKeyDown={(e) => { e.preventDefault(); handleExternalCloseAttempt(); }}
        >
          {showExternalConfirm ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
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
                <button
                  onClick={handleExternalBack}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="px-6 pt-6 pb-0 flex flex-row items-center justify-between">
                <DialogTitle>Book a Call — {externalConfirm?.name}</DialogTitle>
                <button
                  onClick={handleExternalCloseAttempt}
                  className="rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  <span className="sr-only">Close</span>
                </button>
              </DialogHeader>
              <div className="flex-1 px-6 pb-6 min-h-0">
                {externalConfirm && (
                  <iframe
                    src={externalConfirm.url}
                    className="w-full h-full rounded-md border"
                    title={`Booking calendar for ${externalConfirm.name}`}
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

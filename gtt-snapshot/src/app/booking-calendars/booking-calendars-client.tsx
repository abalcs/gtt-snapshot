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
import type { Consultant, DestinationOption } from "@/lib/booking-calendars";

function consultantKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface RegionGroup {
  region: string;
  consultants: Consultant[];
  destinationOptions: DestinationOption[];
}

interface TaRankEntry { country: string; rank: number }

export function BookingCalendarsClient({ regions, taRanks, isAdmin = false, disabledDestinations = [] }: { regions: RegionGroup[]; taRanks: Record<string, TaRankEntry[]>; isAdmin?: boolean; disabledDestinations?: string[] }) {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [calendarModal, setCalendarModal] = useState<{ url: string; name: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [externalConfirm, setExternalConfirm] = useState<{ name: string } | null>(null);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [destFilters, setDestFilters] = useState<Record<string, Set<string>>>({});
  const [disabledDests, setDisabledDests] = useState<string[]>(disabledDestinations);
  const [showDisabledPanel, setShowDisabledPanel] = useState(false);
  const [disableInput, setDisableInput] = useState("");
  const [toggling, setToggling] = useState(false);

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

  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  const toggleDestFilter = (region: string, slug: string) => {
    setDestFilters((prev) => {
      const current = new Set(prev[region] ?? []);
      if (current.has(slug)) current.delete(slug);
      else current.add(slug);
      return { ...prev, [region]: current };
    });
  };

  const clearDestFilter = (region: string) => {
    setDestFilters((prev) => {
      const next = { ...prev };
      delete next[region];
      return next;
    });
  };

  const [statusMsg, setStatusMsg] = useState("");

  const handleToggleDestination = async (slug: string, action: "disable" | "enable") => {
    setToggling(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/admin/booking-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });
      const data = await res.json();
      if (data.success) {
        setDisabledDests(data.disabledDestinations);
        if (action === "disable") setDisableInput("");
        setStatusMsg(action === "disable" ? `"${slug}" disabled. Refresh to see changes.` : `"${slug}" re-enabled. Refresh to see changes.`);
      } else {
        setStatusMsg(`Error: ${data.error || "Something went wrong"}`);
      }
    } catch (err) {
      setStatusMsg(`Error: ${err instanceof Error ? err.message : "Network error"}`);
    }
    setToggling(false);
  };

  return (
    <>
      {isAdmin && (
        <div className="mb-2">
          <button
            onClick={() => setShowDisabledPanel(!showDisabledPanel)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            {showDisabledPanel ? "Hide" : "Manage"} Disabled Destinations
            {disabledDests.length > 0 && (
              <Badge variant="destructive" className="text-xs">{disabledDests.length} disabled</Badge>
            )}
          </button>
          {showDisabledPanel && (
            <div className="mt-3 border rounded-lg p-4 bg-amber-50/50 space-y-3">
              <p className="text-sm text-muted-foreground">
                Disabled destinations are hidden from regional booking calendars but remain visible in Travel Agents view.
              </p>
              {statusMsg && (
                <p className={`text-sm font-medium ${statusMsg.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
                  {statusMsg}
                </p>
              )}
              {disabledDests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {disabledDests.map((slug) => (
                    <span key={slug} className="inline-flex items-center gap-2 rounded-full bg-red-100 text-red-800 px-3 py-1.5 text-sm font-medium">
                      {slug}
                      <button
                        onClick={() => handleToggleDestination(slug, "enable")}
                        disabled={toggling}
                        className="inline-flex items-center justify-center rounded-full bg-red-200 hover:bg-red-300 h-5 w-5 text-red-700 text-xs font-bold disabled:opacity-50 transition-colors"
                        title={`Re-enable ${slug}`}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Destination slug (e.g. italy)"
                  value={disableInput}
                  onChange={(e) => setDisableInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3a5f54]/30"
                />
                <button
                  onClick={() => disableInput.trim() && handleToggleDestination(disableInput.trim().toLowerCase(), "disable")}
                  disabled={toggling || !disableInput.trim()}
                  className="px-4 py-1.5 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Disable
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {regions.map(({ region, consultants, destinationOptions }) => {
          const activeFilters = destFilters[region];
          const hasFilter = activeFilters && activeFilters.size > 0;
          const visibleConsultants = hasFilter
            ? consultants.filter((c) =>
                c.destinations.some((slug) => activeFilters.has(slug))
              )
            : consultants;

          return (
          <section key={region} className="border rounded-lg overflow-hidden shadow-[var(--shadow-sm)]">
            <button
              onClick={() => toggleRegion(region)}
              className="flex w-full items-center justify-between px-4 py-3 bg-gradient-to-r from-[#f0f5f2] to-[#e8f0ec] border-l-4 border-l-[#3a5f54] hover:from-[#e8f0ec] hover:to-[#dde9e3] transition-colors"
            >
              <h2 className="text-lg font-semibold">{region}</h2>
              <span className="flex items-center gap-2 text-muted-foreground text-sm">
                <span>
                  {hasFilter
                    ? `${visibleConsultants.length} of ${consultants.length} specialists`
                    : `${consultants.length} specialists`}
                </span>
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
                {destinationOptions.length > 1 && (
                  <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
                    {destinationOptions.map((opt) => {
                      const isActive = activeFilters?.has(opt.slug);
                      return (
                        <button
                          key={opt.slug}
                          onClick={() => toggleDestFilter(region, opt.slug)}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium border transition-all duration-150 hover:scale-[1.03]",
                            isActive
                              ? "bg-[#3a5f54] text-white border-[#3a5f54] shadow-[var(--shadow-sm)]"
                              : "bg-background text-foreground border-border hover:bg-muted"
                          )}
                        >
                          {opt.name}
                        </button>
                      );
                    })}
                    {hasFilter && (
                      <button
                        onClick={() => clearDestFilter(region)}
                        className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {visibleConsultants.map((consultant) => {
                    const count = clickCounts[consultantKey(consultant.name)] ?? 0;
                    return (
                      <Card key={`${consultant.name}-${region}`}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex flex-col gap-2">
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3a5f54]/10 text-[#3a5f54] text-xs font-semibold shrink-0">
                                    {consultant.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <p className="font-medium">{consultant.name}</p>
                                </div>
                                {count > 0 && (
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {count} {count === 1 ? "booking" : "bookings"} (30d)
                                  </Badge>
                                )}
                              </div>
                              {consultant.title && (
                                <p className="text-sm text-muted-foreground">{consultant.title}</p>
                              )}
                              {taRanks[consultant.name.toLowerCase()] && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {taRanks[consultant.name.toLowerCase()].map((ta) => (
                                    <span
                                      key={ta.country}
                                      className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10"
                                    >
                                      TA{ta.rank} {ta.country}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="text-sm text-muted-foreground mt-1">{consultant.countriesDisplay}</p>
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
              </div>
            </div>
          </section>
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

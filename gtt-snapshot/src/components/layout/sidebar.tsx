"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarContinent {
  name: string;
  destinations: { name: string; slug: string; regionSlug: string; regionName: string; status: string }[];
}

interface SidebarData {
  continents: SidebarContinent[];
  specialSections: { title: string; slug: string }[];
}

const STORAGE_KEY_EXPANDED = "sidebar-expanded-continents";
const STORAGE_KEY_COLLAPSED = "sidebar-collapsed";

export function Sidebar({ initialData }: { initialData: SidebarData }) {
  const pathname = usePathname();
  const data = initialData;

  // Initialize from localStorage if available
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EXPANDED);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY_COLLAPSED) === "true";
    } catch { return false; }
  });

  const [bookingExpanded, setBookingExpanded] = useState(pathname.startsWith("/booking-calendars"));

  // Auto-expand continent containing current destination
  useEffect(() => {
    if (!pathname.startsWith("/destinations/")) return;
    const currentSlug = pathname.split("/destinations/")[1]?.split("/")[0];
    if (!currentSlug) return;
    for (const continent of data.continents) {
      if (continent.destinations.some((d) => d.slug === currentSlug)) {
        setExpandedContinents((prev) => {
          if (prev.has(continent.name)) return prev;
          const next = new Set(prev);
          next.add(continent.name);
          return next;
        });
        break;
      }
    }
  }, [pathname, data.continents]);

  // Persist expanded continents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...expandedContinents]));
    } catch {}
  }, [expandedContinents]);

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(collapsed));
    } catch {}
  }, [collapsed]);

  const toggleContinent = useCallback((name: string) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  // Check if current destination belongs to a continent
  const currentDestSlug = pathname.startsWith("/destinations/") ? pathname.split("/destinations/")[1]?.split("/")[0] : null;

  return (
    <div
      className={cn(
        "hidden md:flex flex-col border-r border-[#2a4a40] bg-gradient-to-b from-[#3a5f54] to-[#2a4a40] text-white transition-all duration-300 ease-in-out",
        collapsed ? "w-12" : "w-64"
      )}
    >
      {/* Header area */}
      <div className="flex items-center border-b border-white/20 px-2 py-3">
        {collapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(false)}
            className="mx-auto h-8 w-8 p-0 text-white hover:bg-white/20 hover:text-white"
            title="Expand sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </Button>
        ) : (
          <div className="flex w-full items-center justify-between px-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-white font-serif whitespace-nowrap">GTT Snapshot</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(true)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20 hover:text-white shrink-0"
              title="Collapse sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
          </div>
        )}
      </div>

      {/* Nav content */}
      <div
        className={cn(
          "flex-1 overflow-hidden transition-opacity duration-200",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <ScrollArea className="h-full">
          <nav className="p-3 space-y-1">
            <Link
              href="/"
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                pathname === "/" && "bg-white/20 text-white shadow-[inset_3px_0_0_white]"
              )}
            >
              Home
            </Link>
            <Link
              href="/destinations"
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                pathname === "/destinations" && "bg-white/20 text-white shadow-[inset_3px_0_0_white]"
              )}
            >
              Help Me Choose
            </Link>
            <Link
              href="/compare"
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                pathname === "/compare" && "bg-white/20 text-white shadow-[inset_3px_0_0_white]"
              )}
            >
              Compare
            </Link>
            <div>
              <button
                onClick={() => setBookingExpanded((prev) => !prev)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:translate-x-0.5 transition-all duration-150",
                  pathname.startsWith("/booking-calendars") && "bg-white/20 text-white"
                )}
              >
                <span className="flex-1 text-left">Booking Calendars</span>
                <span
                  className={cn(
                    "transition-transform duration-200 inline-block text-white/50",
                    bookingExpanded && "rotate-90"
                  )}
                >
                  ›
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                  bookingExpanded
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden ml-3 border-l border-white/20 pl-2 space-y-0.5">
                  <Link
                    href="/booking-calendars"
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                      pathname === "/booking-calendars" &&
                        "bg-white/20 font-medium text-white shadow-[inset_3px_0_0_white]"
                    )}
                  >
                    CS by Region
                  </Link>
                  <Link
                    href="/booking-calendars/travel-agents"
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                      pathname === "/booking-calendars/travel-agents" &&
                        "bg-white/20 font-medium text-white shadow-[inset_3px_0_0_white]"
                    )}
                  >
                    TA Preferred
                  </Link>
                  <Link
                    href="/booking-calendars/gta"
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                      pathname === "/booking-calendars/gta" &&
                        "bg-white/20 font-medium text-white shadow-[inset_3px_0_0_white]"
                    )}
                  >
                    GTA Calendars
                  </Link>
                  <Link
                    href="/booking-calendars/tam"
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                      pathname === "/booking-calendars/tam" &&
                        "bg-white/20 font-medium text-white shadow-[inset_3px_0_0_white]"
                    )}
                  >
                    TAM
                  </Link>
                </div>
              </div>
            </div>
            <Link
              href="/country-specialists"
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                pathname === "/country-specialists" && "bg-white/20 text-white shadow-[inset_3px_0_0_white]"
              )}
            >
              Country Specialists
            </Link>
            <Link
              href="/email-templates"
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                pathname === "/email-templates" && "bg-white/20 text-white shadow-[inset_3px_0_0_white]"
              )}
            >
              Email Templates
            </Link>
            <Link
              href="/stop-sells"
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                pathname === "/stop-sells" && "bg-white/20 text-white shadow-[inset_3px_0_0_white]"
              )}
            >
              Current Stop Sells
            </Link>

            <div className="pt-3 pb-1 px-3">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Regions</span>
              <div className="mt-1.5 h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
            </div>

            {data.continents.map((continent) => {
              const hasActiveDestination = currentDestSlug && continent.destinations.some((d) => d.slug === currentDestSlug);
              return (
                <div key={continent.name}>
                  <button
                    onClick={() => toggleContinent(continent.name)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:translate-x-0.5 transition-all duration-150",
                      hasActiveDestination && "bg-white/10 text-white"
                    )}
                  >
                    <span className="flex-1 text-left">{continent.name}</span>
                    <span className="flex items-center gap-1.5 text-white/50 text-xs ml-2">
                      <span>{continent.destinations.length}</span>
                      <span
                        className={cn(
                          "transition-transform duration-200 inline-block",
                          expandedContinents.has(continent.name) && "rotate-90"
                        )}
                      >
                        ›
                      </span>
                    </span>
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                      expandedContinents.has(continent.name)
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden ml-3 border-l border-white/20 pl-2 space-y-0.5">
                      {continent.destinations.map((dest) => (
                        <Link
                          key={dest.slug}
                          href={`/destinations/${dest.slug}`}
                          className={cn(
                            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                            pathname === `/destinations/${dest.slug}` &&
                              "bg-white/20 font-medium text-white shadow-[inset_3px_0_0_white]",
                            dest.status === "stop_sell" && "text-red-300/90"
                          )}
                        >
                          {dest.name}
                          {dest.status === "stop_sell" && (
                            <span className="shrink-0 rounded bg-red-500/80 px-1 py-px text-[10px] font-bold leading-tight text-white uppercase">Stop</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-3 pb-1 px-3">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Special Sections</span>
              <div className="mt-1.5 h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
            </div>
            <Link
              href="/tce-resources"
              className={cn(
                "block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                pathname === "/tce-resources" &&
                  "bg-white/20 font-medium text-white shadow-[inset_3px_0_0_white]"
              )}
            >
              TCE Resources
            </Link>
            {data.specialSections.length > 0 && (
              <>
                {data.specialSections.map((section) => (
                  <Link
                    key={section.slug}
                    href={`/special/${section.slug}`}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/15 hover:text-white hover:translate-x-0.5 transition-all duration-150",
                      pathname === `/special/${section.slug}` &&
                        "bg-white/20 font-medium text-white shadow-[inset_3px_0_0_white]"
                    )}
                  >
                    {section.title}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </ScrollArea>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarContinent {
  name: string;
  destinations: { name: string; slug: string; regionSlug: string; regionName: string }[];
}

interface SidebarData {
  continents: SidebarContinent[];
  specialSections: { title: string; slug: string }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const [data, setData] = useState<SidebarData | null>(null);
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/sidebar")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const toggleContinent = (name: string) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div
      className={cn(
        "hidden md:flex flex-col border-r border-[#2a4a40] bg-[#3a5f54] text-white transition-all duration-300 ease-in-out",
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
                "block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white transition-colors",
                pathname === "/" && "bg-white/20 text-white"
              )}
            >
              Home
            </Link>
            <Link
              href="/destinations"
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white transition-colors",
                pathname === "/destinations" && "bg-white/20 text-white"
              )}
            >
              All Destinations
            </Link>
            <Link
              href="/help-me-choose"
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white transition-colors",
                pathname === "/help-me-choose" && "bg-white/20 text-white"
              )}
            >
              Help Me Choose
            </Link>

            <div className="pt-3 pb-1 px-3 text-xs font-semibold text-white/60 uppercase tracking-wider">
              Continents
            </div>

            {data?.continents.map((continent) => (
              <div key={continent.name}>
                <button
                  onClick={() => toggleContinent(continent.name)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition-colors",
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
                    "ml-3 border-l border-white/20 pl-2 space-y-0.5 overflow-hidden transition-all duration-200 ease-in-out",
                    expandedContinents.has(continent.name)
                      ? "max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0"
                  )}
                >
                  {continent.destinations.map((dest) => (
                    <Link
                      key={dest.slug}
                      href={`/destinations/${dest.slug}`}
                      className={cn(
                        "block rounded-md px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 hover:text-white transition-colors",
                        pathname === `/destinations/${dest.slug}` &&
                          "bg-white/20 font-medium text-white"
                      )}
                    >
                      {dest.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {data?.specialSections && data.specialSections.length > 0 && (
              <>
                <div className="pt-3 pb-1 px-3 text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Special Sections
                </div>
                {data.specialSections.map((section) => (
                  <Link
                    key={section.slug}
                    href={`/special/${section.slug}`}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/15 hover:text-white transition-colors",
                      pathname === `/special/${section.slug}` &&
                        "bg-white/20 font-medium text-white"
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

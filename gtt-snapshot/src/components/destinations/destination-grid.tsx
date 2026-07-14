"use client";

import { useState } from "react";
import { DestinationCard } from "@/components/destinations/destination-card";
import { CompareBar } from "@/components/destinations/compare-bar";
import type { DestinationWithRegion, TagDefinition } from "@/lib/types";

interface DestinationGridProps {
  destinations: DestinationWithRegion[];
  tagDefinitions: TagDefinition[];
}

export function DestinationGrid({ destinations, tagDefinitions }: DestinationGridProps) {
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const nameMap: Record<string, string> = {};
  for (const d of destinations) {
    nameMap[d.slug] = d.name;
  }

  const toggleCompare = (slug: string) => {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) return prev;
      return [...prev, slug];
    });
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedSlugs([]);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => compareMode ? exitCompareMode() : setCompareMode(true)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            compareMode
              ? "border-[#3a5f54] bg-[#3a5f54] text-white"
              : "border-input hover:bg-muted"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          {compareMode ? "Exit Compare" : "Compare"}
        </button>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${compareMode && selectedSlugs.length > 0 ? "pb-20" : ""}`}>
        {destinations.map((dest) => (
          <DestinationCard
            key={dest.id}
            destination={dest}
            tagDefinitions={tagDefinitions}
            compareMode={compareMode}
            isSelected={selectedSlugs.includes(dest.slug)}
            onToggleCompare={toggleCompare}
          />
        ))}
      </div>

      {/* Compare hint when mode active but nothing selected */}
      {compareMode && selectedSlugs.length === 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="mx-auto max-w-2xl px-4 pb-4">
            <div className="rounded-lg border bg-white/95 backdrop-blur-sm shadow-lg px-4 py-3 text-center text-sm text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1.5 -mt-0.5"><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              Select up to 3 destinations to compare
            </div>
          </div>
        </div>
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          compareMode && selectedSlugs.length > 0
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <CompareBar
          selectedSlugs={selectedSlugs}
          destinationNames={nameMap}
          onRemove={(slug) => setSelectedSlugs((prev) => prev.filter((s) => s !== slug))}
          onClear={exitCompareMode}
        />
      </div>
    </>
  );
}

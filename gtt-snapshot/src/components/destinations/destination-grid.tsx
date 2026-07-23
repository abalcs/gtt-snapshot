"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { DestinationCard } from "@/components/destinations/destination-card";
import { CompareBar } from "@/components/destinations/compare-bar";
import { ViewToggle } from "@/components/destinations/view-toggle";
import { TAG_CATEGORIES, SEASONS, BUDGET_TIERS, type TagCategory } from "@/lib/tags";
import type { DestinationWithRegion, TagDefinition } from "@/lib/types";

const WorldMap = dynamic(() => import("@/components/destinations/world-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] rounded-lg border border-border bg-muted/30">
      <div className="text-sm text-muted-foreground">Loading map...</div>
    </div>
  ),
});

const categoryActiveMap: Record<TagCategory, string> = {
  'trip-style': 'bg-blue-600 text-white',
  'activities': 'bg-green-600 text-white',
  'traveler-profile': 'bg-purple-600 text-white',
  'landscape': 'bg-amber-600 text-white',
};

const seasonActiveMap: Record<string, string> = {
  sky: 'bg-sky-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  orange: 'bg-orange-600 text-white',
  rose: 'bg-rose-600 text-white',
};

interface DestinationGridProps {
  destinations: DestinationWithRegion[];
  allDestinations: DestinationWithRegion[];
  tagDefinitions: TagDefinition[];
  activeTags?: string[];
  activeSeasons?: string[];
  activeBudget?: string[];
  initialViewMode?: "cards" | "map";
}

export function DestinationGrid({
  destinations,
  allDestinations,
  tagDefinitions,
  activeTags = [],
  activeSeasons = [],
  activeBudget = [],
  initialViewMode = "cards",
}: DestinationGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"cards" | "map">(initialViewMode);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [hideDimmed, setHideDimmed] = useState(false);

  const hasFilters = activeTags.length > 0 || activeSeasons.length > 0 || activeBudget.length > 0;

  const filteredSlugs = useMemo(() => new Set(destinations.map(d => d.slug)), [destinations]);

  const nameMap: Record<string, string> = {};
  for (const d of allDestinations) {
    nameMap[d.slug] = d.name;
  }

  const handleViewToggle = (mode: "cards" | "map") => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "map") {
      params.set("view", "map");
    } else {
      params.delete("view");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

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

  const buildMatchBadges = (dest: DestinationWithRegion) => {
    if (!hasFilters) return [];
    const badges: { label: string; color: string }[] = [];
    for (const tag of activeTags) {
      if (dest.tags?.includes(tag)) {
        const def = tagDefinitions.find(t => t.slug === tag);
        if (def) badges.push({ label: def.label, color: categoryActiveMap[def.category as TagCategory] || 'bg-gray-600 text-white' });
      }
    }
    for (const s of activeSeasons) {
      if (dest.best_seasons?.includes(s)) {
        const season = SEASONS.find(ss => ss.slug === s);
        if (season) badges.push({ label: season.label, color: seasonActiveMap[season.color] || 'bg-gray-600 text-white' });
      }
    }
    for (const b of activeBudget) {
      if (dest.budget_tiers?.includes(b)) {
        const tier = BUDGET_TIERS.find(t => t.slug === b);
        if (tier) badges.push({ label: tier.label, color: 'bg-gray-700 text-white' });
      }
    }
    return badges;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <ViewToggle viewMode={viewMode} onToggle={handleViewToggle} />
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
        {viewMode === "map" && hasFilters && (
          <label className="inline-flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={hideDimmed}
              onChange={(e) => setHideDimmed(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 accent-[#3a5f54]"
            />
            Hide non-matching
          </label>
        )}
      </div>

      {viewMode === "map" ? (
        <div className={compareMode && selectedSlugs.length > 0 ? "pb-20" : ""}>
          <WorldMap
            allDestinations={allDestinations}
            filteredSlugs={filteredSlugs}
            hasFilters={hasFilters}
            hideDimmed={hideDimmed}
            tagDefinitions={tagDefinitions}
            compareMode={compareMode}
            selectedSlugs={selectedSlugs}
            onToggleCompare={toggleCompare}
            buildMatchBadges={buildMatchBadges}
          />
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${compareMode && selectedSlugs.length > 0 ? "pb-20" : ""}`}>
          {destinations.map((dest) => {
            const matchBadges = buildMatchBadges(dest);
            return (
              <div key={dest.id} className={matchBadges.length > 0 ? "mb-4" : ""}>
                <DestinationCard
                  destination={dest}
                  tagDefinitions={tagDefinitions}
                  compareMode={compareMode}
                  isSelected={selectedSlugs.includes(dest.slug)}
                  onToggleCompare={toggleCompare}
                />
                {matchBadges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 px-1">
                    {matchBadges.map((badge, i) => (
                      <span key={i} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Compare hint when mode active but nothing selected */}
      {compareMode && selectedSlugs.length === 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[1001]">
          <div className="mx-auto max-w-2xl px-4 pb-4">
            <div className="rounded-lg border bg-white/95 backdrop-blur-sm shadow-lg px-4 py-3 text-center text-sm text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1.5 -mt-0.5"><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              Select up to 3 destinations to compare
            </div>
          </div>
        </div>
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-[1001] transition-all duration-300 ${
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

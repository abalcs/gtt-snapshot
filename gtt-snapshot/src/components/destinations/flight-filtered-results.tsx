"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterPanel, EMPTY_FILTERS, type ChooserFilters, type FilterAvailability } from "@/components/destinations/filter-panel";
import { DestinationGrid } from "@/components/destinations/destination-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { getCoordinates } from "@/lib/country-coordinates";
import { getFlightTimeForSlug, US_DEPARTURE_CITIES } from "@/lib/flight-time";
import { MONTH_LABELS, parseSeasonalityRaw, seasonMonths } from "@/lib/seasonality-months";
import { BUDGET_TIERS } from "@/lib/tags";
import type { DestinationWithRegion, TagDefinition } from "@/lib/types";

interface FlightFilteredResultsProps {
  destinations: DestinationWithRegion[];
  allDestinations: DestinationWithRegion[];
  tagDefinitions: TagDefinition[];
  initialFilters: ChooserFilters;
  initialViewMode: "cards" | "map";
}

const ACCESSIBILITY_CHECKS: Record<string, (d: DestinationWithRegion) => boolean> = {
  "easy-terrain": (d) => d.terrain_difficulty != null && d.terrain_difficulty <= 2,
  "wheelchair-friendly": (d) => d.wheelchair_friendliness != null && d.wheelchair_friendliness >= 3,
  "minimal-walking": (d) => d.walking_required != null && d.walking_required <= 2,
  "low-altitude": (d) => d.altitude_concern != null && d.altitude_concern <= 2,
};

function applyFilters(list: DestinationWithRegion[], f: ChooserFilters): DestinationWithRegion[] {
  let out = list;
  if (f.tags.length > 0) {
    out = out.filter((d) => f.tags.every((tag) => d.tags?.includes(tag)));
  }
  if (f.seasons.length > 0) {
    out = out.filter((d) => f.seasons.some((s) => d.best_seasons?.includes(s)));
  }
  if (f.budget.length > 0) {
    out = out.filter((d) => f.budget.some((b) => d.budget_tiers?.includes(b)));
  }
  if (f.accessibility.length > 0) {
    out = out.filter((d) =>
      f.accessibility.every((slug) => ACCESSIBILITY_CHECKS[slug]?.(d) ?? false)
    );
  }
  if (f.months.length > 0) {
    out = out.filter((d) => {
      const months = seasonMonths(parseSeasonalityRaw(d.seasonality));
      return f.months.some((m) => months.peak.has(m) || months.shoulder.has(m));
    });
  }
  if (f.departureCity && f.maxFlightTime !== null && f.maxFlightTime < 20) {
    out = out.filter((d) => {
      const coords = getCoordinates(d.slug);
      if (!coords) return true; // destinations without coordinates pass through
      const hours = getFlightTimeForSlug(f.departureCity, coords.lat, coords.lng);
      return hours !== null && hours <= (f.maxFlightTime as number);
    });
  }
  return out;
}

interface Preset {
  label: string;
  filters: ChooserFilters;
}



const CHIP =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer hover:scale-[1.03]";
const CHIP_ON = "bg-[#0e4d5c] text-white border-[#0e4d5c] shadow-sm";
const CHIP_OFF = "bg-white text-foreground border-input hover:border-[#0e4d5c]/60";
const MONTH_ON = "bg-[#c9a227] text-[#3d2f04] border-[#c9a227] shadow-sm";

export function FlightFilteredResults({
  destinations,
  allDestinations,
  tagDefinitions,
  initialFilters,
  initialViewMode,
}: FlightFilteredResultsProps) {
  // Some data sets (including the local seed) carry no tags, best_seasons or
  // accessibility scores at all. Detect that so the UI can say so instead of
  // silently returning zero results for those filters.
  const availability: FilterAvailability = {
    tags: destinations.some((d) => (d.tags ?? []).length > 0),
    seasons: destinations.some((d) => (d.best_seasons ?? []).length > 0),
    accessibility: destinations.some(
      (d) =>
        d.terrain_difficulty != null ||
        d.wheelchair_friendliness != null ||
        d.walking_required != null ||
        d.altitude_concern != null
    ),
  };

  const [filters, setFilters] = useState<ChooserFilters>(() => ({
    ...initialFilters,
    tags: availability.tags ? initialFilters.tags : [],
    seasons: availability.seasons ? initialFilters.seasons : [],
    accessibility: availability.accessibility ? initialFilters.accessibility : [],
  }));
  const filtered = useMemo(() => applyFilters(destinations, filters), [destinations, filters]);

  const presets: Preset[] = useMemo(() => {
    const list: Preset[] = [
      { label: "Summer highlights", filters: { ...EMPTY_FILTERS, months: [5, 6, 7] } },
      { label: "Best value", filters: { ...EMPTY_FILTERS, budget: ["best-value"] } },
      {
        label: "Under 10 hours from New York",
        filters: { ...EMPTY_FILTERS, departureCity: "JFK", maxFlightTime: 10 },
      },
      { label: "Premium splurge", filters: { ...EMPTY_FILTERS, budget: ["premium"] } },
    ];
    if (availability.tags) {
      list.unshift(
        { label: "Safari", filters: { ...EMPTY_FILTERS, tags: ["safari-and-wildlife"] } },
        { label: "Honeymoon", filters: { ...EMPTY_FILTERS, tags: ["honeymoon-and-romance"] } }
      );
    }
    return list;
  }, [availability.tags]);

  // Keep the URL in step (without a page reload) so shortlists stay shareable.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setOrDelete = (key: string, value: string | null) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };
    setOrDelete("tags", filters.tags.length ? filters.tags.join(",") : null);
    setOrDelete("seasons", filters.seasons.length ? filters.seasons.join(",") : null);
    setOrDelete("budget", filters.budget.length ? filters.budget.join(",") : null);
    setOrDelete("accessibility", filters.accessibility.length ? filters.accessibility.join(",") : null);
    setOrDelete("months", filters.months.length ? filters.months.map((m) => m + 1).join(",") : null);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/destinations?${qs}` : "/destinations");
  }, [filters]);

  // Zero-results rescue: which single filter group, if removed, restores the most?
  const rescue = useMemo(() => {
    if (filtered.length > 0) return null;
    const groups: { label: string; cleared: ChooserFilters }[] = [];
    if (filters.tags.length) groups.push({ label: "interests", cleared: { ...filters, tags: [] } });
    if (filters.months.length) groups.push({ label: "travel months", cleared: { ...filters, months: [] } });
    if (filters.seasons.length) groups.push({ label: "season", cleared: { ...filters, seasons: [] } });
    if (filters.budget.length) groups.push({ label: "budget", cleared: { ...filters, budget: [] } });
    if (filters.accessibility.length)
      groups.push({ label: "accessibility needs", cleared: { ...filters, accessibility: [] } });
    if (filters.departureCity && filters.maxFlightTime !== null && filters.maxFlightTime < 20)
      groups.push({ label: "flight limit", cleared: { ...filters, maxFlightTime: 20 } });
    let best: { label: string; count: number; cleared: ChooserFilters } | null = null;
    for (const g of groups) {
      const count = applyFilters(destinations, g.cleared).length;
      if (count > 0 && (!best || count > best.count)) best = { ...g, count };
    }
    return best;
  }, [filtered.length, filters, destinations]);

  const hasAnyFilter =
    filters.tags.length > 0 ||
    filters.seasons.length > 0 ||
    filters.budget.length > 0 ||
    filters.accessibility.length > 0 ||
    filters.months.length > 0 ||
    !!filters.departureCity;

  const loveTags = tagDefinitions.filter(
    (t) => t.category === "trip-style" || t.category === "activities"
  );
  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div className="space-y-6">
      {/* Guided chooser */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-[#0d4256] to-[#07222b] px-6 py-5">
          <h2 className="font-serif text-xl font-semibold text-white">Start with your client</h2>
          <p className="mt-0.5 text-sm text-white/70">
            Take the brief here. The shortlist below updates as you go, and you can refine it further underneath.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setFilters(preset.filters)}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <CardContent className="space-y-4 py-5">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">They&apos;re travelling in</p>
            <div className="flex flex-wrap gap-1.5">
              {MONTH_LABELS.map((label, i) => {
                const isActive = filters.months.includes(i);
                return (
                  <button
                    key={label}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        months: isActive
                          ? filters.months.filter((m) => m !== i)
                          : [...filters.months, i].sort((a, b) => a - b),
                      })
                    }
                    className={`${CHIP} px-2.5 ${isActive ? MONTH_ON : CHIP_OFF}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              They love
              {!availability.tags && (
                <span className="ml-2 text-xs font-normal">(tag data isn&apos;t in this copy of the site)</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {loveTags.map((tag) => {
                const isActive = filters.tags.includes(tag.slug);
                return (
                  <button
                    key={tag.slug}
                    disabled={!availability.tags}
                    onClick={() => setFilters({ ...filters, tags: toggleIn(filters.tags, tag.slug) })}
                    className={`${CHIP} ${isActive ? CHIP_ON : CHIP_OFF} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Budget</p>
              <div className="flex flex-wrap gap-2">
                {BUDGET_TIERS.map((tier) => {
                  const isActive = filters.budget.includes(tier.slug);
                  return (
                    <button
                      key={tier.slug}
                      onClick={() => setFilters({ ...filters, budget: toggleIn(filters.budget, tier.slug) })}
                      className={`${CHIP} ${isActive ? CHIP_ON : CHIP_OFF}`}
                    >
                      {tier.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="min-w-[220px]">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Flying from</p>
              <Select
                value={filters.departureCity || undefined}
                onValueChange={(code) =>
                  setFilters({
                    ...filters,
                    departureCity: code,
                    maxFlightTime: code ? filters.maxFlightTime : null,
                  })
                }
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Departure city" />
                </SelectTrigger>
                <SelectContent>
                  {US_DEPARTURE_CITIES.map((city) => (
                    <SelectItem key={city.code} value={city.code}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {filters.departureCity && (
              <div className="flex min-w-[220px] flex-1 items-center gap-3">
                <span className="whitespace-nowrap text-sm text-muted-foreground">Max flight:</span>
                <Slider
                  min={4}
                  max={20}
                  step={0.5}
                  value={[filters.maxFlightTime ?? 20]}
                  onValueChange={([v]) => setFilters({ ...filters, maxFlightTime: v })}
                  className="flex-1"
                />
                <span className="w-[60px] whitespace-nowrap text-sm font-medium text-[#0e4d5c]">
                  {filters.maxFlightTime !== null && filters.maxFlightTime < 20
                    ? `${filters.maxFlightTime}h`
                    : "Any"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <p className="text-sm">
              <span className="font-serif text-lg font-semibold text-[#0e4d5c]">{filtered.length}</span>{" "}
              <span className="text-muted-foreground">
                destination{filtered.length !== 1 ? "s" : ""} fit this brief
              </span>
            </p>
            {hasAnyFilter && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Start over
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        tagDefinitions={tagDefinitions}
        shownCount={filtered.length}
        totalCount={destinations.length}
        availability={availability}
      />

      {filtered.length > 0 ? (
        <DestinationGrid
          destinations={filtered}
          allDestinations={allDestinations}
          tagDefinitions={tagDefinitions}
          activeTags={filters.tags}
          activeSeasons={filters.seasons}
          activeBudget={filters.budget}
          initialViewMode={initialViewMode}
        />
      ) : (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="font-serif text-lg font-semibold">No destinations match that brief</p>
            {rescue ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Removing the {rescue.label} filter would bring back {rescue.count} destination
                  {rescue.count !== 1 ? "s" : ""}.
                </p>
                <button
                  onClick={() => setFilters(rescue.cleared)}
                  className="rounded-full bg-[#0e4d5c] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d4256]"
                >
                  Remove {rescue.label} (show {rescue.count})
                </button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Try removing a filter or two, or start over with a broader brief.
              </p>
            )}
            <div>
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Clear all filters
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

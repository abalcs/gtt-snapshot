"use client";

import { useState, useMemo } from "react";
import { FilterPanel } from "@/components/destinations/filter-panel";
import { DestinationGrid } from "@/components/destinations/destination-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { getCoordinates } from "@/lib/country-coordinates";
import { getFlightTimeForSlug } from "@/lib/flight-time";
import type { DestinationWithRegion, TagDefinition } from "@/lib/types";

interface FlightFilteredResultsProps {
  destinations: DestinationWithRegion[];
  allDestinations: DestinationWithRegion[];
  tagDefinitions: TagDefinition[];
  activeTags: string[];
  activeSeasons: string[];
  activeBudget: string[];
  activeAccessibility: string[];
  hasServerFilters: boolean;
  initialViewMode: "cards" | "map";
}

export function FlightFilteredResults({
  destinations,
  allDestinations,
  tagDefinitions,
  activeTags,
  activeSeasons,
  activeBudget,
  activeAccessibility,
  hasServerFilters,
  initialViewMode,
}: FlightFilteredResultsProps) {
  const [departureCity, setDepartureCity] = useState("");
  const [maxFlightTime, setMaxFlightTime] = useState<number | null>(null);

  const handleDepartureCityChange = (code: string) => {
    setDepartureCity(code);
    if (!code) {
      setMaxFlightTime(null);
    }
  };

  const filteredDestinations = useMemo(() => {
    if (!departureCity || maxFlightTime === null || maxFlightTime >= 20) {
      return destinations;
    }
    return destinations.filter((d) => {
      const coords = getCoordinates(d.slug);
      if (!coords) return true; // destinations without coordinates pass through
      const hours = getFlightTimeForSlug(departureCity, coords.lat, coords.lng);
      return hours !== null && hours <= maxFlightTime;
    });
  }, [destinations, departureCity, maxFlightTime]);

  const hasFilters = hasServerFilters || !!departureCity;

  return (
    <>
      <FilterPanel
        currentTags={activeTags}
        currentSeasons={activeSeasons}
        currentBudget={activeBudget}
        currentAccessibility={activeAccessibility}
        departureCity={departureCity}
        maxFlightTime={maxFlightTime}
        onDepartureCityChange={handleDepartureCityChange}
        onMaxFlightTimeChange={setMaxFlightTime}
        tagDefinitions={tagDefinitions}
      />

      {filteredDestinations.length > 0 ? (
        <>
          {departureCity && maxFlightTime !== null && maxFlightTime < 20 && filteredDestinations.length !== destinations.length && (
            <p className="text-sm text-muted-foreground -mt-3">
              Showing {filteredDestinations.length} of {destinations.length} destinations within {maxFlightTime}h flight
            </p>
          )}
          <DestinationGrid
            destinations={filteredDestinations}
            allDestinations={allDestinations}
            tagDefinitions={tagDefinitions}
            activeTags={activeTags}
            activeSeasons={activeSeasons}
            activeBudget={activeBudget}
            initialViewMode={initialViewMode}
          />
        </>
      ) : hasFilters ? (
        <EmptyState
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
          heading="No destinations match your filters"
          description="Try removing some filters or broadening your search."
          action={{ label: "Clear all filters", href: "/destinations" }}
        />
      ) : null}
    </>
  );
}

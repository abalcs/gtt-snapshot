import Link from "next/link";
import { getAllDestinations, getAllRegions, getAllTagDefinitions, getDestinationPopularity } from "@/lib/queries";
import { DestinationFilters } from "@/components/destinations/destination-filters";
import { FilterPanel } from "@/components/destinations/filter-panel";
import { DestinationGrid } from "@/components/destinations/destination-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; tags?: string; seasons?: string; budget?: string; accessibility?: string; view?: string }>;
}) {
  return <DestinationsContent searchParamsPromise={searchParams} />;
}

async function DestinationsContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ region?: string; tags?: string; seasons?: string; budget?: string; accessibility?: string; view?: string }>;
}) {
  await requireAuth();
  const { region, tags: tagsParam, seasons: seasonsParam, budget: budgetParam, accessibility: accessibilityParam, view } = await searchParamsPromise;
  const [allDestinations, regions, tagDefinitions, popularity] = await Promise.all([
    getAllDestinations(),
    getAllRegions(),
    getAllTagDefinitions(),
    getDestinationPopularity(),
  ]);

  const activeRegions = region ? region.split(",").filter(Boolean) : [];
  const activeTags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  const activeSeasons = seasonsParam ? seasonsParam.split(",").filter(Boolean) : [];
  const activeBudget = budgetParam ? budgetParam.split(",").filter(Boolean) : [];
  const activeAccessibility = accessibilityParam ? accessibilityParam.split(",").filter(Boolean) : [];

  const hasFilters = activeRegions.length > 0 || activeTags.length > 0 || activeSeasons.length > 0 || activeBudget.length > 0 || activeAccessibility.length > 0;

  let filteredDestinations = activeRegions.length > 0
    ? allDestinations.filter((d) => activeRegions.some((r) => d.region_slug === r))
    : allDestinations;

  if (activeTags.length > 0) {
    filteredDestinations = filteredDestinations.filter((d) =>
      activeTags.every((tag) => d.tags?.includes(tag))
    );
  }

  if (activeSeasons.length > 0) {
    filteredDestinations = filteredDestinations.filter((d) =>
      activeSeasons.some((s) => d.best_seasons?.includes(s))
    );
  }

  if (activeBudget.length > 0) {
    filteredDestinations = filteredDestinations.filter((d) =>
      activeBudget.some((b) => d.budget_tiers?.includes(b))
    );
  }

  if (activeAccessibility.length > 0) {
    const accessibilityChecks: Record<string, (d: typeof filteredDestinations[0]) => boolean> = {
      'easy-terrain': (d) => d.terrain_difficulty !== null && d.terrain_difficulty !== undefined && d.terrain_difficulty <= 2,
      'wheelchair-friendly': (d) => d.wheelchair_friendliness !== null && d.wheelchair_friendliness !== undefined && d.wheelchair_friendliness >= 3,
      'minimal-walking': (d) => d.walking_required !== null && d.walking_required !== undefined && d.walking_required <= 2,
      'low-altitude': (d) => d.altitude_concern !== null && d.altitude_concern !== undefined && d.altitude_concern <= 2,
    };
    filteredDestinations = filteredDestinations.filter((d) =>
      activeAccessibility.every((slug) => accessibilityChecks[slug]?.(d) ?? false)
    );
  }

  // Sort by popularity (view count desc), then alphabetically for 0-view destinations
  filteredDestinations.sort((a, b) => {
    const aViews = popularity[a.slug] ?? 0;
    const bViews = popularity[b.slug] ?? 0;
    if (aViews !== bViews) return bViews - aViews;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">All Destinations</h1>
          {hasFilters && (
            <Link
              href="/destinations"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              Clear all filters
            </Link>
          )}
        </div>
        <p className="text-muted-foreground">
          {filteredDestinations.length} destination{filteredDestinations.length !== 1 ? "s" : ""}
          {activeRegions.length > 0 ? ` in ${activeRegions.length} region${activeRegions.length !== 1 ? "s" : ""}` : ""}
          {activeTags.length > 0 ? ` matching ${activeTags.length} tag${activeTags.length !== 1 ? "s" : ""}` : ""}
          {activeSeasons.length > 0 ? ` in ${activeSeasons.length} season${activeSeasons.length !== 1 ? "s" : ""}` : ""}
          {activeBudget.length > 0 ? ` in ${activeBudget.length} budget tier${activeBudget.length !== 1 ? "s" : ""}` : ""}
          {activeAccessibility.length > 0 ? ` with ${activeAccessibility.length} accessibility filter${activeAccessibility.length !== 1 ? "s" : ""}` : ""}
        </p>
      </div>

      <DestinationFilters regions={regions} currentRegions={activeRegions} />

      <FilterPanel
        currentTags={activeTags}
        currentSeasons={activeSeasons}
        currentBudget={activeBudget}
        currentAccessibility={activeAccessibility}
        tagDefinitions={tagDefinitions}
      />

      {filteredDestinations.length > 0 ? (
        <DestinationGrid
          destinations={filteredDestinations}
          allDestinations={allDestinations}
          tagDefinitions={tagDefinitions}
          activeTags={activeTags}
          activeSeasons={activeSeasons}
          activeBudget={activeBudget}
          initialViewMode={view === "map" ? "map" : "cards"}
        />
      ) : hasFilters ? (
        <EmptyState
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
          heading="No destinations match your filters"
          description="Try removing some filters or broadening your search."
          action={{ label: "Clear all filters", href: "/destinations" }}
        />
      ) : null}
    </div>
  );
}

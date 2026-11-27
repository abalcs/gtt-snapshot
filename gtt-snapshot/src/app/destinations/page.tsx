import Link from "next/link";
import { getAllDestinations, getAllRegions, getAllTagDefinitions, getDestinationPopularity } from "@/lib/queries";
import { DestinationFilters } from "@/components/destinations/destination-filters";
import { FlightFilteredResults } from "@/components/destinations/flight-filtered-results";
import { requireAuth } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

type DestinationsParams = {
  region?: string;
  tags?: string;
  budget?: string;
  accessibility?: string;
  months?: string;
  view?: string;
};

export default function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<DestinationsParams>;
}) {
  return <DestinationsContent searchParamsPromise={searchParams} />;
}

async function DestinationsContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<DestinationsParams>;
}) {
  await requireAuth();
  const { region, tags: tagsParam, budget: budgetParam, accessibility: accessibilityParam, months: monthsParam, view } = await searchParamsPromise;
  const [allDestinations, regions, tagDefinitions, popularity] = await Promise.all([
    getAllDestinations(),
    getAllRegions(),
    getAllTagDefinitions(),
    getDestinationPopularity(),
  ]);

  const activeRegions = region ? region.split(",").filter(Boolean) : [];
  const activeTags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  const activeBudget = budgetParam ? budgetParam.split(",").filter(Boolean) : [];
  const activeAccessibility = accessibilityParam ? accessibilityParam.split(",").filter(Boolean) : [];
  const activeMonths = monthsParam
    ? monthsParam
        .split(",")
        .map((m) => parseInt(m, 10) - 1)
        .filter((m) => !Number.isNaN(m) && m >= 0 && m <= 11)
    : [];

  const hasFilters =
    activeRegions.length > 0 ||
    activeTags.length > 0 ||
    activeBudget.length > 0 ||
    activeAccessibility.length > 0 ||
    activeMonths.length > 0;

  // Region filtering and popularity sort stay server-side; the client hub
  // applies every other filter instantly without a page reload.
  let filteredDestinations = activeRegions.length > 0
    ? allDestinations.filter((d) => activeRegions.some((r) => d.region_slug === r))
    : allDestinations;

  filteredDestinations = [...filteredDestinations].sort((a, b) => {
    const aViews = popularity[a.slug] ?? 0;
    const bViews = popularity[b.slug] ?? 0;
    if (aViews !== bViews) return bViews - aViews;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-[28px] font-semibold tracking-tight">Help Me Choose</h1>
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
          {" "}— narrow them down with the brief below.
        </p>
      </div>

      <DestinationFilters regions={regions} currentRegions={activeRegions} />

      <FlightFilteredResults
        destinations={filteredDestinations}
        allDestinations={allDestinations}
        tagDefinitions={tagDefinitions}
        initialFilters={{
          tags: activeTags,
          budget: activeBudget,
          accessibility: activeAccessibility,
          months: activeMonths,
          departureCity: "",
          maxFlightTime: null,
        }}
        initialViewMode={view === "map" ? "map" : "cards"}
      />
    </div>
  );
}

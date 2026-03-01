import { getAllDestinations, getAllRegions, getAllTagDefinitions } from "@/lib/queries";
import { DestinationFilters } from "@/components/destinations/destination-filters";
import { TagFilterBar } from "@/components/destinations/tag-filter-bar";
import { DestinationGrid } from "@/components/destinations/destination-grid";

export const dynamic = 'force-dynamic';

export default function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; tags?: string }>;
}) {
  return <DestinationsContent searchParamsPromise={searchParams} />;
}

async function DestinationsContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ region?: string; tags?: string }>;
}) {
  const { region, tags: tagsParam } = await searchParamsPromise;
  const [allDestinations, regions, tagDefinitions] = await Promise.all([
    getAllDestinations(),
    getAllRegions(),
    getAllTagDefinitions(),
  ]);

  const activeTags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

  let filteredDestinations = region
    ? allDestinations.filter((d) => d.region_slug === region)
    : allDestinations;

  if (activeTags.length > 0) {
    filteredDestinations = filteredDestinations.filter((d) =>
      activeTags.every((tag) => d.tags?.includes(tag))
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Destinations</h1>
        <p className="text-muted-foreground">
          {filteredDestinations.length} destination{filteredDestinations.length !== 1 ? "s" : ""}
          {region ? ` in selected region` : ""}
          {activeTags.length > 0 ? ` matching ${activeTags.length} tag${activeTags.length !== 1 ? "s" : ""}` : ""}
        </p>
      </div>

      <DestinationFilters regions={regions} currentRegion={region} />

      <TagFilterBar currentTags={activeTags} tagDefinitions={tagDefinitions} />

      <DestinationGrid destinations={filteredDestinations} tagDefinitions={tagDefinitions} />
    </div>
  );
}

import { getAllDestinations, getAllRegions } from "@/lib/queries";
import { DestinationCard } from "@/components/destinations/destination-card";
import { DestinationFilters } from "@/components/destinations/destination-filters";

export const dynamic = 'force-dynamic';

export default function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  return <DestinationsContent searchParamsPromise={searchParams} />;
}

async function DestinationsContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ region?: string }>;
}) {
  const { region } = await searchParamsPromise;
  const [allDestinations, regions] = await Promise.all([
    getAllDestinations(),
    getAllRegions(),
  ]);

  const filteredDestinations = region
    ? allDestinations.filter((d) => d.region_slug === region)
    : allDestinations;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Destinations</h1>
        <p className="text-muted-foreground">
          {filteredDestinations.length} destination{filteredDestinations.length !== 1 ? "s" : ""}
          {region ? ` in selected region` : ""}
        </p>
      </div>

      <DestinationFilters regions={regions} currentRegion={region} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDestinations.map((dest) => (
          <DestinationCard key={dest.id} destination={dest} />
        ))}
      </div>
    </div>
  );
}

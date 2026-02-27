import { notFound } from "next/navigation";
import Link from "next/link";
import { getRegionBySlug, getDestinationsByRegion } from "@/lib/queries";
import { DestinationCard } from "@/components/destinations/destination-card";

export const dynamic = 'force-dynamic';

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const region = await getRegionBySlug(slug);

  if (!region) notFound();

  const destinations = await getDestinationsByRegion(slug);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span>{region.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{region.name}</h1>
        {region.description && (
          <p className="text-muted-foreground mt-1">{region.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {destinations.length} destination{destinations.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {destinations.map((dest) => (
          <DestinationCard key={dest.id} destination={dest} />
        ))}
      </div>
    </div>
  );
}

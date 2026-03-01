import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllRegions, getStats, getAllDestinations, getAdminLogs } from "@/lib/queries";
import { WhatsNewFeed } from "@/components/whats-new-feed";
import { getContinentForDestination, getContinentOrder } from "@/lib/continents";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [regions, stats, allDestinations, recentLogs] = await Promise.all([
    getAllRegions(),
    getStats(),
    getAllDestinations(),
    getAdminLogs(10),
  ]);
  const continentOrder = getContinentOrder();

  // Group destinations by continent
  const continentMap = new Map<string, { name: string; slug: string }[]>();
  for (const dest of allDestinations) {
    const continent = getContinentForDestination(dest.slug, dest.region_slug);
    if (!continentMap.has(continent)) {
      continentMap.set(continent, []);
    }
    continentMap.get(continent)!.push({ name: dest.name, slug: dest.slug });
  }

  const continents = Array.from(continentMap.entries())
    .sort(([a], [b]) => {
      const ai = continentOrder.indexOf(a);
      const bi = continentOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    })
    .map(([name, destinations]) => ({ name, destinations }));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GTT Country Snapshot</h1>
        <p className="text-muted-foreground mt-1">
          Audley Travel destination reference guide
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stats.activeDestinations}</div>
            <p className="text-sm text-muted-foreground">Active Destinations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{continents.length}</div>
            <p className="text-sm text-muted-foreground">Continents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{regions.length}</div>
            <p className="text-sm text-muted-foreground">Regions</p>
          </CardContent>
        </Card>
      </div>

      {/* Help Me Choose CTA */}
      <Card className="border-[#3a5f54]/20 bg-[#3a5f54]/5">
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Not sure where to send your client?</h3>
            <p className="text-sm text-muted-foreground mt-1">Use our tag-based filter to narrow down destinations by travel style, activities, and more.</p>
          </div>
          <Link
            href="/help-me-choose"
            className="shrink-0 inline-flex items-center justify-center rounded-md bg-[#3a5f54] text-white px-4 py-2 text-sm font-medium hover:bg-[#2a4a40] transition-colors"
          >
            Help Me Choose
          </Link>
        </CardContent>
      </Card>

      {/* What's New */}
      {recentLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">What&apos;s New</h2>
            <Link
              href="/whats-new"
              className="text-sm text-primary hover:underline"
            >
              View all updates
            </Link>
          </div>
          <WhatsNewFeed logs={recentLogs} />
        </div>
      )}

      {/* Continent cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Continents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {continents.map((continent) => (
            <Card key={continent.name} className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{continent.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="mb-3">
                  {continent.destinations.length} destination{continent.destinations.length !== 1 ? "s" : ""}
                </Badge>
                <div className="flex flex-wrap gap-1.5">
                  {continent.destinations.map((dest) => (
                    <Link
                      key={dest.slug}
                      href={`/destinations/${dest.slug}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {dest.name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

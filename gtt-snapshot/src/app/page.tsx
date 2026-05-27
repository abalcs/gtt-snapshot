import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllRegions, getStats, getAllDestinations, getAdminLogs } from "@/lib/queries";
import { WhatsNewFeed } from "@/components/whats-new-feed";
import { getContinentForDestination, getContinentOrder } from "@/lib/continents";
import { requireAuth } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await requireAuth();
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
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#3a5f54] via-[#2a4a40] to-[#1e3830] px-8 py-8">
        <div className="absolute inset-0 bg-dots opacity-10" />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-white">GTT Country Snapshot</h1>
          <p className="text-white/70 mt-1">
            Audley Travel destination reference guide
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-border/60">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-[#3a5f54]/5 -translate-y-6 translate-x-6" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#3a5f54]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a5f54" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7Z"/></svg>
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.activeDestinations}</div>
                <p className="text-sm text-muted-foreground">Active Destinations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-border/60">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-[#6b9a88]/5 -translate-y-6 translate-x-6" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#6b9a88]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b9a88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              </div>
              <div>
                <div className="text-3xl font-bold">{regions.length}</div>
                <p className="text-sm text-muted-foreground">Continents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-border/60">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-[#9abcad]/5 -translate-y-6 translate-x-6" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#9abcad]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9abcad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>
              </div>
              <div>
                <div className="text-3xl font-bold">{continents.length}</div>
                <p className="text-sm text-muted-foreground">Regions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Me Choose CTA */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#3a5f54] to-[#6b9a88] px-8 py-6 shadow-[var(--shadow-lg)]">
        <div className="absolute inset-0 bg-dots opacity-5" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg text-white">Not sure where to send your client?</h3>
            <p className="text-sm text-white/70 mt-1">Use our tag-based filter to narrow down destinations by travel style, activities, and more.</p>
          </div>
          <Link
            href="/help-me-choose"
            className="shrink-0 inline-flex items-center justify-center rounded-md bg-white text-[#3a5f54] px-4 py-2 text-sm font-medium hover:bg-white/90 transition-colors shadow-sm"
          >
            Help Me Choose
          </Link>
        </div>
      </div>

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
            <Card key={continent.name} className="h-full border-l-4 border-l-[#3a5f54]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{continent.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="mb-3">
                  {continent.destinations.length} destination{continent.destinations.length !== 1 ? "s" : ""}
                </Badge>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {continent.destinations.map((dest) => (
                    <Link
                      key={dest.slug}
                      href={`/destinations/${dest.slug}`}
                      className="text-xs text-primary hover:underline hover:text-[#2a4a40] transition-colors"
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

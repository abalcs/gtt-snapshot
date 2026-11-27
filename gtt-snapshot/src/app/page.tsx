import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllDestinations, getAdminLogs } from "@/lib/queries";
import { WhatsNewFeed } from "@/components/whats-new-feed";
import { getContinentForDestination, getContinentOrder } from "@/lib/continents";
import { getFlagUrl } from "@/lib/country-flags";
import { requireAuth } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await requireAuth();
  const [allDestinations, recentLogs] = await Promise.all([
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

  const siteSettings = await getSiteSettings();

  // Search suggestions: a few recognisable destinations that exist in the data
  const preferred = ["Kenya", "Japan", "Italy", "Peru", "New Zealand", "South Africa", "India"];
  const available = new Set(allDestinations.map((d) => d.name));
  const suggestions = preferred.filter((n) => available.has(n)).slice(0, 5);
  for (const d of allDestinations) {
    if (suggestions.length >= 5) break;
    if (!suggestions.includes(d.name)) suggestions.push(d.name);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Search-first hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d4256] via-[#0e4d5c] to-[#07222b] px-8 py-10">
        <div className="absolute inset-0 bg-dots opacity-10" />
        <div className="relative max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white">{siteSettings.hero_title}</h1>
          <p className="text-white/70 mt-2 text-base">{siteSettings.hero_subtitle}</p>
          <div className="mt-4 h-0.5 w-24 bg-[#c9a227]" />
          <form action="/search" method="get" className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0e4d5c]/50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                type="search"
                name="q"
                placeholder="Search destinations, guides and topics…"
                className="w-full rounded-lg bg-white py-3 pl-11 pr-4 text-[15px] text-[#22332c] shadow-[var(--shadow-md)] outline-none ring-[#c9a227] placeholder:text-[#22332c]/40 focus:ring-2"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-[#c9a227] px-5 py-3 text-[15px] font-semibold text-[#07222b] shadow-[var(--shadow-md)] transition-colors hover:bg-[#d9b545]"
            >
              Search
            </button>
          </form>
          {suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-white/50">Popular:</span>
              {suggestions.map((name) => (
                <Link
                  key={name}
                  href={`/search?q=${encodeURIComponent(name)}`}
                  className="rounded-full border border-white/25 px-2.5 py-1 text-white/85 transition-colors hover:border-[#c9a227] hover:text-white"
                >
                  {name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/destinations", title: "Help Me Choose", blurb: "Filter by travel style and interests", path: "M12 2a7 7 0 0 1 7 7c0 2.4-1.2 3.9-2.4 5.2-.9 1-1.6 1.8-1.6 2.8H9c0-1-.7-1.8-1.6-2.8C6.2 12.9 5 11.4 5 9a7 7 0 0 1 7-7Z" },
          { href: "/compare", title: "Compare", blurb: "Put destinations side by side", path: "M8 3v18M16 3v18M3 8h5M3 16h5M16 8h5M16 16h5" },
          { href: "/booking-calendars", title: "Booking Calendars", blurb: "Who covers what, and when", path: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" },
          { href: "/whats-new", title: "What's New", blurb: "The latest updates across the guide", path: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" },
        ].map((tile) => (
          <Link key={tile.href} href={tile.href} className="group">
            <Card className="h-full border-border/60 transition-all duration-200 group-hover:border-[#c9a227] group-hover:shadow-[var(--shadow-md)] group-hover:-translate-y-0.5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#0e4d5c]/10 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0e4d5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={tile.path} /></svg>
                </div>
                <div className="font-semibold text-sm">{tile.title}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{tile.blurb}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
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
        <h2 className="text-xl font-semibold mb-4">Browse by region</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {continents.map((continent) => (
            <Card key={continent.name} className="h-full border-l-4 border-l-[#0e4d5c] hover:shadow-md hover:-translate-y-0.5 hover:border-l-[#c9a227] transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{continent.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="mb-3">
                  {continent.destinations.length} destination{continent.destinations.length !== 1 ? "s" : ""}
                </Badge>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {continent.destinations.map((dest) => (
                    <Link
                      key={dest.slug}
                      href={`/destinations/${dest.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline hover:text-[#0e4d5c] transition-colors"
                    >
                      {getFlagUrl(dest.name) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getFlagUrl(dest.name)} alt="" className="h-3 w-[18px] rounded-[2px] object-cover shadow-sm" />
                      )}
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

import { NextResponse } from 'next/server';
import { getSidebarData } from '@/lib/queries';
import { getContinentForDestination, getContinentOrder } from '@/lib/continents';

// In-memory cache for sidebar data (5 minutes)
interface SidebarCache {
  data: {
    continents: { name: string; destinations: { name: string; slug: string; regionSlug: string; regionName: string }[] }[];
    regions: unknown[];
    specialSections: { title: string; slug: string }[];
  };
  expires: number;
}

let sidebarCache: SidebarCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Return cached data if still valid
    if (sidebarCache && Date.now() < sidebarCache.expires) {
      return NextResponse.json(sidebarCache.data);
    }

    const data = await getSidebarData();
    const continentOrder = getContinentOrder();

    // Build continent → destinations mapping
    const continentMap = new Map<string, { name: string; slug: string; regionSlug: string; regionName: string }[]>();

    for (const region of data.regions) {
      for (const dest of region.destinations) {
        const continent = getContinentForDestination(dest.slug, region.slug);
        if (!continentMap.has(continent)) {
          continentMap.set(continent, []);
        }
        continentMap.get(continent)!.push({
          name: dest.name,
          slug: dest.slug,
          regionSlug: region.slug,
          regionName: region.name,
        });
      }
    }

    // Sort continents by defined order, then alphabetically for any extras
    const continents = Array.from(continentMap.entries())
      .sort(([a], [b]) => {
        const ai = continentOrder.indexOf(a);
        const bi = continentOrder.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
      })
      .map(([name, destinations]) => ({
        name,
        destinations: destinations.sort((a, b) => a.name.localeCompare(b.name)),
      }));

    const responseData = {
      continents,
      regions: data.regions,
      specialSections: data.specialSections,
    };

    // Cache the computed data
    sidebarCache = {
      data: responseData,
      expires: Date.now() + CACHE_TTL_MS,
    };

    return NextResponse.json(responseData);
  } catch {
    return NextResponse.json({ continents: [], regions: [], specialSections: [] });
  }
}

// Allow cache invalidation from other parts of the app
export function invalidateSidebarCache() {
  sidebarCache = null;
}

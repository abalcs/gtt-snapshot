import { NextResponse } from 'next/server';
import { getSidebarData } from '@/lib/queries';
import { getContinentForDestination, getContinentOrder } from '@/lib/continents';
import { getCached, setCache } from '@/lib/data-cache';

interface SidebarResponse {
  continents: { name: string; destinations: { name: string; slug: string; regionSlug: string; regionName: string }[] }[];
  regions: unknown[];
  specialSections: { title: string; slug: string }[];
}

export async function GET() {
  try {
    const cached = getCached<SidebarResponse>('sidebar:api');
    if (cached) return NextResponse.json(cached);

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

    const responseData: SidebarResponse = {
      continents,
      regions: data.regions,
      specialSections: data.specialSections,
    };

    setCache('sidebar:api', responseData);
    return NextResponse.json(responseData);
  } catch {
    return NextResponse.json({ continents: [], regions: [], specialSections: [] });
  }
}

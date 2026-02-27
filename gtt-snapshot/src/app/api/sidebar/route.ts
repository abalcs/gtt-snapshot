import { NextResponse } from 'next/server';
import { getSidebarData } from '@/lib/queries';
import { getContinentForDestination, getContinentOrder } from '@/lib/continents';

export async function GET() {
  try {
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

    return NextResponse.json({
      continents,
      regions: data.regions,
      specialSections: data.specialSections,
    });
  } catch {
    return NextResponse.json({ continents: [], regions: [], specialSections: [] });
  }
}

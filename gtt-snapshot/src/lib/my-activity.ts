import { getDb } from "../../db/database";
import { getAllDestinations } from "./queries";

export interface MyActivity {
  hasData: boolean;
  totalPageViews: number;
  totalSearches: number;
  activeDaysCount: number;
  sessionsCount: number;
  lastActive: string | null;
  firstDay: string | null;
  streakDays: number;
  destinationsExplored: number;
  topDestinations: { slug: string; name: string; views: number }[];
  topRegion: { name: string; views: number } | null;
  rank: number | null;
  teamSize: number;
  moreActiveThanPct: number | null;
}

/** favourite_destinations is stored nested, with legacy flat dot keys. */
function favoritesMap(data: Record<string, unknown>): Record<string, number> {
  const nested = (data["favorite_destinations"] as Record<string, number> | undefined) ?? {};
  const result: Record<string, number> = { ...nested };
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("favorite_destinations.") && typeof value === "number") {
      const sub = key.slice("favorite_destinations.".length);
      result[sub] = (result[sub] ?? 0) + value;
    }
  }
  return result;
}

function currentStreak(activeDays: string[]): number {
  const set = new Set(activeDays);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  let cursor = new Date();
  if (!set.has(fmt(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(fmt(cursor))) return 0;
  }
  let streak = 0;
  while (set.has(fmt(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getMyActivity(email: string): Promise<MyActivity> {
  const db = getDb();
  const key = email.toLowerCase();
  const doc = await db.collection("analytics_users").doc(key).get();

  const empty: MyActivity = {
    hasData: false,
    totalPageViews: 0,
    totalSearches: 0,
    activeDaysCount: 0,
    sessionsCount: 0,
    lastActive: null,
    firstDay: null,
    streakDays: 0,
    destinationsExplored: 0,
    topDestinations: [],
    topRegion: null,
    rank: null,
    teamSize: 0,
    moreActiveThanPct: null,
  };
  if (!doc.exists) return empty;

  const data = doc.data() as Record<string, unknown>;
  const favorites = favoritesMap(data);
  const activeDays: string[] = Array.isArray(data.active_days) ? (data.active_days as string[]) : [];
  const totalPageViews = (data.total_page_views as number) ?? 0;

  // Destination names + regions for the favourites
  let nameBySlug = new Map<string, { name: string; region: string }>();
  try {
    const all = await getAllDestinations();
    nameBySlug = new Map(all.map((d) => [d.slug, { name: d.name, region: d.region_name }]));
  } catch {
    // names fall back to slugs
  }

  const favEntries = Object.entries(favorites).sort((a, b) => b[1] - a[1]);
  const topDestinations = favEntries.slice(0, 3).map(([slug, views]) => ({
    slug,
    name: nameBySlug.get(slug)?.name ?? slug,
    views,
  }));

  const regionViews: Record<string, number> = {};
  for (const [slug, views] of favEntries) {
    const region = nameBySlug.get(slug)?.region;
    if (region) regionViews[region] = (regionViews[region] ?? 0) + views;
  }
  const topRegionEntry = Object.entries(regionViews).sort((a, b) => b[1] - a[1])[0];

  // Standing within the team, by page views
  let rank: number | null = null;
  let teamSize = 0;
  let moreActiveThanPct: number | null = null;
  try {
    const snap = await db.collection("analytics_users").get();
    teamSize = snap.size;
    if (teamSize > 1) {
      let more = 0;
      let fewer = 0;
      for (const d of snap.docs) {
        if (d.id === key) continue;
        const views = (d.data().total_page_views as number) ?? 0;
        if (views > totalPageViews) more++;
        else if (views < totalPageViews) fewer++;
      }
      rank = more + 1;
      moreActiveThanPct = Math.round((fewer / (teamSize - 1)) * 100);
    } else if (teamSize === 1) {
      rank = 1;
    }
  } catch {
    // standing is a nice-to-have; the rest still renders
  }

  const sortedDays = [...activeDays].sort();
  return {
    hasData: true,
    totalPageViews,
    totalSearches: (data.total_searches as number) ?? 0,
    activeDaysCount: activeDays.length,
    sessionsCount: Array.isArray(data.session_ids) ? data.session_ids.length : 0,
    lastActive: (data.last_active as string) ?? null,
    firstDay: sortedDays[0] ?? null,
    streakDays: currentStreak(activeDays),
    destinationsExplored: favEntries.length,
    topDestinations,
    topRegion: topRegionEntry ? { name: topRegionEntry[0], views: topRegionEntry[1] } : null,
    rank,
    teamSize,
    moreActiveThanPct,
  };
}

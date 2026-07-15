import { getDb } from "../../db/database";
import { FieldValue } from "firebase-admin/firestore";
import type {
  AnalyticsEvent,
  AnalyticsEventBatch,
  AnalyticsDashboardData,
  AnalyticsDashboardDataV2,
  PeriodComparison,
  HeatmapCell,
  DestinationTrend,
  UserEngagement,
  EngagementTier,
  FunnelStage,
  ContentCoverage,
  ActivityFeedItem,
  JourneyStep,
  AnalyticsSession,
} from "./analytics-types";

const db = () => getDb();

// ── Write: Record an event batch ─────────────────────────

export async function recordEventBatch(batch: AnalyticsEventBatch): Promise<void> {
  // 1. Store raw event batch
  await db().collection("analytics_events").add(batch);

  // 2. Update daily rollups + user profiles for each event
  const today = batch.flushed_at.slice(0, 10); // "2026-07-14"
  const dailyRef = db().collection("analytics_daily").doc(today);
  const userRef = db().collection("analytics_users").doc(batch.user_email);

  // Collect session IDs from events
  const sessionIds = new Set<string>();

  for (const event of batch.events) {
    const eventDate = event.timestamp.slice(0, 10);
    const eventDailyRef = eventDate === today ? dailyRef : db().collection("analytics_daily").doc(eventDate);
    const eventHour = new Date(event.timestamp).getHours();

    if (event.session_id) sessionIds.add(event.session_id);

    if (event.type === "page_view") {
      // Daily rollup
      await eventDailyRef.set({
        date: eventDate,
        total_page_views: FieldValue.increment(1),
        unique_users: FieldValue.arrayUnion(batch.user_email),
        [`hourly_views.${eventHour}`]: FieldValue.increment(1),
      }, { merge: true });

      // Destination-specific view count
      if (event.destination) {
        await eventDailyRef.set({
          [`destination_views.${event.destination}`]: FieldValue.increment(1),
        }, { merge: true });
      }

      // User profile
      await userRef.set({
        email: batch.user_email,
        name: batch.user_name,
        last_active: batch.flushed_at,
        total_page_views: FieldValue.increment(1),
        active_days: FieldValue.arrayUnion(eventDate),
      }, { merge: true });

      if (event.destination) {
        await userRef.set({
          [`favorite_destinations.${event.destination}`]: FieldValue.increment(1),
        }, { merge: true });
      }
    }

    if (event.type === "page_leave" && event.dwell_ms) {
      // Aggregate dwell time in daily rollups
      await eventDailyRef.set({
        date: eventDate,
        destination_dwell_ms: FieldValue.increment(event.dwell_ms),
        destination_dwell_count: FieldValue.increment(1),
      }, { merge: true });
    }

    if (event.type === "search" && event.search_query) {
      const queryKey = event.search_query.toLowerCase().trim().replace(/\./g, "_");
      await eventDailyRef.set({
        date: eventDate,
        [`searches.${queryKey}`]: FieldValue.increment(1),
        unique_users: FieldValue.arrayUnion(batch.user_email),
      }, { merge: true });

      if (event.search_results === 0) {
        await eventDailyRef.set({
          zero_result_searches: FieldValue.arrayUnion(event.search_query.toLowerCase().trim()),
        }, { merge: true });
      }

      await userRef.set({
        email: batch.user_email,
        name: batch.user_name,
        last_active: batch.flushed_at,
        total_searches: FieldValue.increment(1),
      }, { merge: true });
    }

    if (event.type === "compare" || event.type === "help_me_choose") {
      await eventDailyRef.set({
        date: eventDate,
        [`feature_usage.${event.type}`]: FieldValue.increment(1),
        unique_users: FieldValue.arrayUnion(batch.user_email),
      }, { merge: true });
    }

    if (event.type.startsWith("filter_")) {
      const filterKey = `${event.filter_type}:${event.filter_value}`;
      await eventDailyRef.set({
        date: eventDate,
        [`filter_usage.${filterKey}`]: FieldValue.increment(1),
        unique_users: FieldValue.arrayUnion(batch.user_email),
      }, { merge: true });
    }
  }

  // Track session IDs on user profile
  if (sessionIds.size > 0) {
    await userRef.set({
      session_ids: FieldValue.arrayUnion(...Array.from(sessionIds)),
    }, { merge: true });
  }
}

// ── Read: Dashboard data (v1) ─────────────────────────────

export async function getDashboardData(rangeDays: number): Promise<AnalyticsDashboardData> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - rangeDays);
  const startStr = startDate.toISOString().slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  // Fetch daily rollups in range
  const dailySnap = await db()
    .collection("analytics_daily")
    .where("date", ">=", startStr)
    .orderBy("date", "asc")
    .get();

  const dailyDocs = dailySnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{
    id: string;
    date: string;
    total_page_views?: number;
    unique_users?: string[];
    destination_views?: Record<string, number>;
    searches?: Record<string, number>;
    zero_result_searches?: string[];
    feature_usage?: Record<string, number>;
    filter_usage?: Record<string, number>;
    hourly_views?: Record<string, number>;
  }>;

  // Overview
  const todayDoc = dailyDocs.find(d => d.date === todayStr);
  const activeUsersToday = todayDoc?.unique_users?.length ?? 0;

  let pageViews7d = 0;
  let searches7d = 0;
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDayStr = sevenDaysAgo.toISOString().slice(0, 10);

  const destViewsAgg: Record<string, number> = {};
  const searchesAgg: Record<string, number> = {};
  const zeroResultSet = new Set<string>();
  const featureAgg: Record<string, number> = {};
  const filterAgg: Record<string, number> = {};
  const hourlyAgg = new Array(24).fill(0);
  const dailyViews: { date: string; views: number }[] = [];

  for (const doc of dailyDocs) {
    const views = doc.total_page_views ?? 0;
    dailyViews.push({ date: doc.date, views });

    if (doc.date >= sevenDayStr) {
      pageViews7d += views;
      for (const [q, c] of Object.entries(doc.searches ?? {})) {
        searches7d += c;
        searchesAgg[q] = (searchesAgg[q] ?? 0) + c;
      }
    }

    for (const [slug, c] of Object.entries(doc.destination_views ?? {})) {
      destViewsAgg[slug] = (destViewsAgg[slug] ?? 0) + c;
    }

    for (const q of doc.zero_result_searches ?? []) {
      zeroResultSet.add(q);
    }

    for (const [f, c] of Object.entries(doc.feature_usage ?? {})) {
      featureAgg[f] = (featureAgg[f] ?? 0) + c;
    }

    for (const [f, c] of Object.entries(doc.filter_usage ?? {})) {
      filterAgg[f] = (filterAgg[f] ?? 0) + c;
    }

    if (doc.hourly_views) {
      for (const [h, c] of Object.entries(doc.hourly_views)) {
        const idx = parseInt(h, 10);
        if (idx >= 0 && idx < 24) hourlyAgg[idx] += c;
      }
    }
  }

  // Top destination
  const topDest = Object.entries(destViewsAgg).sort((a, b) => b[1] - a[1])[0] ?? null;

  // Pages: top 20 destinations by views
  const pages = Object.entries(destViewsAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([slug, views]) => ({ slug, views }));

  // Searches
  const searches = Object.entries(searchesAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([query, count]) => ({
      query,
      count,
      zero_results: zeroResultSet.has(query),
    }));

  // Features
  const features = Object.entries(featureAgg)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Filters
  const filters = Object.entries(filterAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => ({ key, count }));

  // Users
  const userSnap = await db()
    .collection("analytics_users")
    .orderBy("last_active", "desc")
    .limit(50)
    .get();

  const users = userSnap.docs.map(d => {
    const data = d.data();
    const activeDays: string[] = data.active_days ?? [];
    const recentDays = activeDays.filter(day => day >= startStr);
    const favDests: Record<string, number> = data.favorite_destinations ?? {};
    const topDest = Object.entries(favDests).sort((a, b) => b[1] - a[1])[0];
    return {
      email: data.email ?? d.id,
      name: data.name ?? d.id,
      last_active: data.last_active ?? "",
      page_views_30d: data.total_page_views ?? 0,
      active_days_count: recentDays.length,
      top_destination: topDest ? topDest[0] : null,
    };
  });

  return {
    overview: {
      active_users_today: activeUsersToday,
      page_views_7d: pageViews7d,
      searches_7d: searches7d,
      top_destination: topDest ? { slug: topDest[0], count: topDest[1] } : null,
      daily_views: dailyViews,
      hourly_views: hourlyAgg,
    },
    users,
    pages,
    searches,
    features,
    filters,
  };
}

// ── V2 Query Functions ──────────────────────────────────

type DailyDoc = {
  date: string;
  total_page_views?: number;
  unique_users?: string[];
  destination_views?: Record<string, number>;
  searches?: Record<string, number>;
  zero_result_searches?: string[];
  feature_usage?: Record<string, number>;
  filter_usage?: Record<string, number>;
  hourly_views?: Record<string, number>;
  destination_dwell_ms?: number;
  destination_dwell_count?: number;
};

function dateRange(rangeDays: number): { startStr: string; prevStartStr: string; todayStr: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - rangeDays);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - rangeDays);
  return {
    startStr: start.toISOString().slice(0, 10),
    prevStartStr: prevStart.toISOString().slice(0, 10),
    todayStr: now.toISOString().slice(0, 10),
  };
}

async function fetchDailyDocs(fromDate: string): Promise<DailyDoc[]> {
  const snap = await db()
    .collection("analytics_daily")
    .where("date", ">=", fromDate)
    .orderBy("date", "asc")
    .get();
  return snap.docs.map(d => d.data() as DailyDoc);
}

function splitPeriods(docs: DailyDoc[], startStr: string): { current: DailyDoc[]; previous: DailyDoc[] } {
  return {
    current: docs.filter(d => d.date >= startStr),
    previous: docs.filter(d => d.date < startStr),
  };
}

function makePeriodComparison(current: number, previous: number): PeriodComparison {
  const change_pct = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
  return { current, previous, change_pct };
}

export async function getComparisonStats(rangeDays: number): Promise<AnalyticsDashboardDataV2["comparisons"]> {
  const { startStr, prevStartStr } = dateRange(rangeDays);
  const allDocs = await fetchDailyDocs(prevStartStr);
  const { current, previous } = splitPeriods(allDocs, startStr);

  const sumViews = (docs: DailyDoc[]) => docs.reduce((s, d) => s + (d.total_page_views ?? 0), 0);
  const sumSearches = (docs: DailyDoc[]) => docs.reduce((s, d) => {
    return s + Object.values(d.searches ?? {}).reduce((a, b) => a + b, 0);
  }, 0);
  const uniqueUsers = (docs: DailyDoc[]) => {
    const set = new Set<string>();
    docs.forEach(d => (d.unique_users ?? []).forEach(u => set.add(u)));
    return set.size;
  };

  // Booking clicks comparison
  const clickSnap = await db().collection("booking-clicks").get();
  const now = Date.now();
  const rangeMs = rangeDays * 86_400_000;
  let currentClicks = 0;
  let previousClicks = 0;
  for (const doc of clickSnap.docs) {
    const clicks: string[] = doc.data().clicks ?? [];
    for (const ts of clicks) {
      const age = now - new Date(ts).getTime();
      if (age <= rangeMs) currentClicks++;
      else if (age <= rangeMs * 2) previousClicks++;
    }
  }

  return {
    page_views: makePeriodComparison(sumViews(current), sumViews(previous)),
    searches: makePeriodComparison(sumSearches(current), sumSearches(previous)),
    active_users: makePeriodComparison(uniqueUsers(current), uniqueUsers(previous)),
    booking_clicks: makePeriodComparison(currentClicks, previousClicks),
  };
}

export async function getHeatmapData(rangeDays: number): Promise<HeatmapCell[]> {
  const { startStr } = dateRange(rangeDays);
  const docs = await fetchDailyDocs(startStr);
  // Build 7×24 grid
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  for (const doc of docs) {
    const dayOfWeek = new Date(doc.date + "T12:00:00").getDay(); // 0=Sun
    if (doc.hourly_views) {
      for (const [h, c] of Object.entries(doc.hourly_views)) {
        const hour = parseInt(h, 10);
        if (hour >= 0 && hour < 24) grid[dayOfWeek][hour] += c;
      }
    }
  }

  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ day, hour, value: grid[day][hour] });
    }
  }
  return cells;
}

export async function getDestinationTrends(rangeDays: number): Promise<{ growing: DestinationTrend[]; declining: DestinationTrend[] }> {
  const { startStr, prevStartStr } = dateRange(rangeDays);
  const allDocs = await fetchDailyDocs(prevStartStr);
  const { current, previous } = splitPeriods(allDocs, startStr);

  const aggregate = (docs: DailyDoc[]) => {
    const agg: Record<string, number> = {};
    docs.forEach(d => {
      for (const [slug, c] of Object.entries(d.destination_views ?? {})) {
        agg[slug] = (agg[slug] ?? 0) + c;
      }
    });
    return agg;
  };

  const currentAgg = aggregate(current);
  const previousAgg = aggregate(previous);
  const allSlugs = new Set([...Object.keys(currentAgg), ...Object.keys(previousAgg)]);

  // Build daily views arrays for sparklines (current period only)
  const dailyBySlug: Record<string, number[]> = {};
  for (const doc of current) {
    for (const slug of allSlugs) {
      if (!dailyBySlug[slug]) dailyBySlug[slug] = [];
      dailyBySlug[slug].push(doc.destination_views?.[slug] ?? 0);
    }
  }

  const trends: DestinationTrend[] = [];
  for (const slug of allSlugs) {
    const cv = currentAgg[slug] ?? 0;
    const pv = previousAgg[slug] ?? 0;
    if (cv === 0 && pv === 0) continue;
    const change_pct = pv === 0 ? (cv > 0 ? 100 : 0) : Math.round(((cv - pv) / pv) * 100);
    trends.push({ slug, current_views: cv, previous_views: pv, change_pct, daily_views: dailyBySlug[slug] ?? [] });
  }

  trends.sort((a, b) => b.change_pct - a.change_pct);
  return {
    growing: trends.filter(t => t.change_pct > 0).slice(0, 5),
    declining: trends.filter(t => t.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct).slice(0, 5),
  };
}

export async function getUserEngagement(rangeDays: number): Promise<UserEngagement[]> {
  const { startStr } = dateRange(rangeDays);
  const userSnap = await db()
    .collection("analytics_users")
    .orderBy("last_active", "desc")
    .limit(50)
    .get();

  // Get feature usage per user from event batches
  const eventSnap = await db()
    .collection("analytics_events")
    .where("flushed_at", ">=", new Date(startStr).toISOString())
    .limit(500)
    .get();

  const userFeatures: Record<string, Set<string>> = {};
  for (const doc of eventSnap.docs) {
    const batch = doc.data() as AnalyticsEventBatch;
    if (!userFeatures[batch.user_email]) userFeatures[batch.user_email] = new Set();
    for (const ev of batch.events) {
      if (ev.type !== "page_view" && ev.type !== "page_leave") {
        userFeatures[batch.user_email].add(ev.type);
      }
    }
  }

  return userSnap.docs.map(d => {
    const data = d.data();
    const activeDays: string[] = data.active_days ?? [];
    const recentDays = activeDays.filter(day => day >= startStr);
    const favDests: Record<string, number> = data.favorite_destinations ?? {};
    const topDest = Object.entries(favDests).sort((a, b) => b[1] - a[1])[0];
    const features = Array.from(userFeatures[data.email ?? d.id] ?? []);

    const score = (recentDays.length * 3) + ((data.total_page_views ?? 0) * 1) + ((data.total_searches ?? 0) * 2) + (features.length * 5);
    let tier: EngagementTier = "inactive";
    if (score >= 50) tier = "power";
    else if (score >= 10) tier = "regular";

    return {
      email: data.email ?? d.id,
      name: data.name ?? d.id,
      last_active: data.last_active ?? "",
      page_views_30d: data.total_page_views ?? 0,
      active_days_count: recentDays.length,
      top_destination: topDest ? topDest[0] : null,
      tier,
      engagement_score: score,
      features_used: features,
    };
  });
}

export async function getContentCoverage(rangeDays: number): Promise<ContentCoverage[]> {
  const { startStr } = dateRange(rangeDays);

  // Get all destinations
  const destSnap = await db()
    .collection("destinations")
    .orderBy("name", "asc")
    .get();

  // Get view counts from daily docs
  const dailyDocs = await fetchDailyDocs(startStr);
  const viewCounts: Record<string, number> = {};
  for (const doc of dailyDocs) {
    for (const [slug, c] of Object.entries(doc.destination_views ?? {})) {
      viewCounts[slug] = (viewCounts[slug] ?? 0) + c;
    }
  }

  return destSnap.docs.map(d => {
    const data = d.data();
    return {
      slug: data.slug ?? d.id,
      name: data.name ?? d.id,
      region: data.region_name ?? "",
      views_30d: viewCounts[data.slug ?? d.id] ?? 0,
      status: data.status ?? "active",
    };
  }).sort((a, b) => a.views_30d - b.views_30d); // 0-view first
}

export function reconstructSessions(batches: AnalyticsEventBatch[]): AnalyticsSession[] {
  // Group events by user + session_id
  const sessionMap: Record<string, { events: AnalyticsEvent[]; user_email: string; user_name: string }> = {};

  for (const batch of batches) {
    for (const event of batch.events) {
      const sid = event.session_id ?? "unknown";
      const key = `${batch.user_email}::${sid}`;
      if (!sessionMap[key]) {
        sessionMap[key] = { events: [], user_email: batch.user_email, user_name: batch.user_name };
      }
      sessionMap[key].events.push(event);
    }
  }

  const sessions: AnalyticsSession[] = [];
  for (const [key, { events, user_email, user_name }] of Object.entries(sessionMap)) {
    if (events.length === 0) continue;
    events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // Split by 30-min gaps
    const groups: AnalyticsEvent[][] = [[]];
    for (let i = 0; i < events.length; i++) {
      if (i > 0) {
        const gap = new Date(events[i].timestamp).getTime() - new Date(events[i - 1].timestamp).getTime();
        if (gap > 30 * 60 * 1000) groups.push([]);
      }
      groups[groups.length - 1].push(events[i]);
    }

    for (const group of groups) {
      if (group.length === 0) continue;
      const start = group[0].timestamp;
      const end = group[group.length - 1].timestamp;
      const destinations = [...new Set(group.filter(e => e.destination).map(e => e.destination!))];
      sessions.push({
        session_id: group[0].session_id ?? key,
        user_email,
        user_name,
        start,
        end,
        duration_ms: new Date(end).getTime() - new Date(start).getTime(),
        entry_page: group[0].path,
        exit_page: group[group.length - 1].path,
        destinations,
        event_count: group.length,
      });
    }
  }

  return sessions.sort((a, b) => b.start.localeCompare(a.start));
}

export async function getFunnelData(rangeDays: number): Promise<FunnelStage[]> {
  const { startStr } = dateRange(rangeDays);

  // Fetch event batches
  const eventSnap = await db()
    .collection("analytics_events")
    .where("flushed_at", ">=", new Date(startStr).toISOString())
    .limit(1000)
    .get();

  const batches = eventSnap.docs.map(d => d.data() as AnalyticsEventBatch);
  const sessions = reconstructSessions(batches);

  // Funnel stages: Browse → Search → View Destination → Compare/HMC → Booking Click
  let browseCount = sessions.length;
  let searchCount = 0;
  let destViewCount = 0;
  let compareCount = 0;

  for (const batch of batches) {
    const userSessions = new Set<string>();
    for (const ev of batch.events) {
      const sid = ev.session_id ?? "default";
      if (ev.type === "search") userSessions.add(`search-${sid}`);
      if (ev.type === "page_view" && ev.destination) userSessions.add(`dest-${sid}`);
      if (ev.type === "compare" || ev.type === "help_me_choose") userSessions.add(`compare-${sid}`);
    }
    searchCount += [...userSessions].filter(s => s.startsWith("search-")).length > 0 ? 1 : 0;
    destViewCount += [...userSessions].filter(s => s.startsWith("dest-")).length > 0 ? 1 : 0;
    compareCount += [...userSessions].filter(s => s.startsWith("compare-")).length > 0 ? 1 : 0;
  }

  // Booking clicks
  const clickSnap = await db().collection("booking-clicks").get();
  const rangeMs = rangeDays * 86_400_000;
  const now = Date.now();
  let bookingClicks = 0;
  for (const doc of clickSnap.docs) {
    const clicks: string[] = doc.data().clicks ?? [];
    bookingClicks += clicks.filter(ts => now - new Date(ts).getTime() <= rangeMs).length;
  }

  const top = Math.max(browseCount, 1);
  return [
    { label: "Browse", count: browseCount, pct_of_top: 100 },
    { label: "Search", count: searchCount, pct_of_top: Math.round((searchCount / top) * 100) },
    { label: "View Destination", count: destViewCount, pct_of_top: Math.round((destViewCount / top) * 100) },
    { label: "Compare / HMC", count: compareCount, pct_of_top: Math.round((compareCount / top) * 100) },
    { label: "Booking Click", count: bookingClicks, pct_of_top: Math.round((bookingClicks / top) * 100) },
  ];
}

export async function getJourneyFlows(rangeDays: number): Promise<JourneyStep[]> {
  const { startStr } = dateRange(rangeDays);
  const eventSnap = await db()
    .collection("analytics_events")
    .where("flushed_at", ">=", new Date(startStr).toISOString())
    .limit(500)
    .get();

  const transitions: Record<string, number> = {};
  for (const doc of eventSnap.docs) {
    const batch = doc.data() as AnalyticsEventBatch;
    const events = batch.events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    for (let i = 1; i < events.length; i++) {
      if (events[i].type === "page_leave") continue;
      const key = `${events[i - 1].type}→${events[i].type}`;
      transitions[key] = (transitions[key] ?? 0) + 1;
    }
  }

  return Object.entries(transitions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => {
      const [from, to] = key.split("→");
      return { from, to, count };
    });
}

export async function getBookingCorrelation(rangeDays: number): Promise<{ slug: string; views: number; clicks: number }[]> {
  const { startStr } = dateRange(rangeDays);
  const dailyDocs = await fetchDailyDocs(startStr);
  const rangeMs = rangeDays * 86_400_000;
  const now = Date.now();

  // Aggregate destination views
  const viewCounts: Record<string, number> = {};
  for (const doc of dailyDocs) {
    for (const [slug, c] of Object.entries(doc.destination_views ?? {})) {
      viewCounts[slug] = (viewCounts[slug] ?? 0) + c;
    }
  }

  // Get consultant data and booking clicks
  const consultantSnap = await db().collection("consultants").get();
  const clickSnap = await db().collection("booking-clicks").get();

  // Map consultant → destinations
  const consultantDests: Record<string, string[]> = {};
  for (const doc of consultantSnap.docs) {
    consultantDests[doc.id] = doc.data().destinations ?? [];
  }

  // Map destination → clicks
  const destClicks: Record<string, number> = {};
  for (const doc of clickSnap.docs) {
    const clicks: string[] = doc.data().clicks ?? [];
    const recentClicks = clicks.filter(ts => now - new Date(ts).getTime() <= rangeMs).length;
    const dests = consultantDests[doc.id] ?? [];
    for (const dest of dests) {
      destClicks[dest] = (destClicks[dest] ?? 0) + recentClicks;
    }
  }

  const allSlugs = new Set([...Object.keys(viewCounts), ...Object.keys(destClicks)]);
  return Array.from(allSlugs)
    .map(slug => ({ slug, views: viewCounts[slug] ?? 0, clicks: destClicks[slug] ?? 0 }))
    .filter(d => d.views > 0 || d.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20);
}

export async function getFeedbackTrend(rangeDays: number): Promise<{ date: string; count: number }[]> {
  const { startStr } = dateRange(rangeDays);
  const snap = await db()
    .collection("feedback")
    .where("created_at", ">=", startStr)
    .orderBy("created_at", "asc")
    .get();

  const dayCounts: Record<string, number> = {};
  for (const doc of snap.docs) {
    const date = (doc.data().created_at ?? "").slice(0, 10);
    if (date) dayCounts[date] = (dayCounts[date] ?? 0) + 1;
  }

  return Object.entries(dayCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

export async function getRecentActivity(limit: number = 20): Promise<ActivityFeedItem[]> {
  const snap = await db()
    .collection("analytics_events")
    .orderBy("flushed_at", "desc")
    .limit(10)
    .get();

  const items: ActivityFeedItem[] = [];
  for (const doc of snap.docs) {
    const batch = doc.data() as AnalyticsEventBatch;
    for (const event of batch.events) {
      if (event.type === "page_leave") continue;
      items.push({
        timestamp: event.timestamp,
        user_name: batch.user_name,
        event_type: event.type,
        path: event.path,
        destination: event.destination,
        search_query: event.search_query,
      });
    }
  }

  return items
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

// ── Read: Dashboard data (v2) ─────────────────────────────

export async function getDashboardDataV2(rangeDays: number): Promise<AnalyticsDashboardDataV2> {
  const v1 = await getDashboardData(rangeDays);

  const [
    comparisons,
    heatmap,
    trends,
    engagement,
    funnel,
    coverage,
    feed,
    journeys,
    booking_correlation,
    feedback_trend,
  ] = await Promise.all([
    getComparisonStats(rangeDays),
    getHeatmapData(rangeDays),
    getDestinationTrends(rangeDays),
    getUserEngagement(rangeDays),
    getFunnelData(rangeDays),
    getContentCoverage(rangeDays),
    getRecentActivity(20),
    getJourneyFlows(rangeDays),
    getBookingCorrelation(rangeDays),
    getFeedbackTrend(rangeDays),
  ]);

  return {
    ...v1,
    comparisons,
    heatmap,
    trends,
    engagement,
    funnel,
    coverage,
    feed,
    journeys,
    booking_correlation,
    feedback_trend,
    daily_views_sparkline: v1.overview.daily_views.map(d => d.views),
  };
}

// ── Cleanup: Delete old event docs ───────────────────────

export async function cleanupOldEvents(retentionDays: number = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffStr = cutoff.toISOString();

  const snap = await db()
    .collection("analytics_events")
    .where("flushed_at", "<", cutoffStr)
    .limit(500)
    .get();

  if (snap.empty) return 0;

  const batch = db().batch();
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();
  return snap.size;
}

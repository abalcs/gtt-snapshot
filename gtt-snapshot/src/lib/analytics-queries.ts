import { getDb } from "../../db/database";
import { FieldValue } from "firebase-admin/firestore";
import type { AnalyticsEvent, AnalyticsEventBatch, AnalyticsDashboardData } from "./analytics-types";

const db = () => getDb();

// ── Write: Record an event batch ─────────────────────────

export async function recordEventBatch(batch: AnalyticsEventBatch): Promise<void> {
  // 1. Store raw event batch
  await db().collection("analytics_events").add(batch);

  // 2. Update daily rollups + user profiles for each event
  const today = batch.flushed_at.slice(0, 10); // "2026-07-14"
  const dailyRef = db().collection("analytics_daily").doc(today);
  const userRef = db().collection("analytics_users").doc(batch.user_email);
  const hour = new Date(batch.flushed_at).getHours();

  for (const event of batch.events) {
    const eventDate = event.timestamp.slice(0, 10);
    const eventDailyRef = eventDate === today ? dailyRef : db().collection("analytics_daily").doc(eventDate);
    const eventHour = new Date(event.timestamp).getHours();

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
}

// ── Read: Dashboard data ─────────────────────────────────

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

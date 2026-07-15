/**
 * Seeds realistic analytics data into Firestore for dashboard development.
 *
 * Populates:
 *   - analytics_daily (60 days of rollups)
 *   - analytics_users (12 fake users with engagement data)
 *   - analytics_events (raw event batches with sessions)
 *   - booking-clicks (correlated click data)
 *   - feedback (sample feedback submissions)
 *
 * Usage:
 *   npx tsx scripts/seed-analytics.ts
 *   npx tsx scripts/seed-analytics.ts --clean   # delete seeded data first
 */

import { getDb } from "../db/database";
import { FieldValue } from "firebase-admin/firestore";

const db = getDb();

// ── Realistic data ───────────────────────────────────────

const DESTINATIONS = [
  "botswana", "kenya", "tanzania", "south-africa", "namibia", "rwanda",
  "costa-rica", "peru", "galapagos", "iceland", "japan", "new-zealand",
  "italy", "croatia", "greece", "thailand", "vietnam", "india",
  "australia", "morocco", "portugal", "sri-lanka", "colombia", "chile",
];

const USERS = [
  { email: "sarah.johnson@gtt.com", name: "Sarah Johnson" },
  { email: "mike.chen@gtt.com", name: "Mike Chen" },
  { email: "emily.davis@gtt.com", name: "Emily Davis" },
  { email: "james.wilson@gtt.com", name: "James Wilson" },
  { email: "lisa.martinez@gtt.com", name: "Lisa Martinez" },
  { email: "david.brown@gtt.com", name: "David Brown" },
  { email: "anna.taylor@gtt.com", name: "Anna Taylor" },
  { email: "chris.lee@gtt.com", name: "Chris Lee" },
  { email: "rachel.garcia@gtt.com", name: "Rachel Garcia" },
  { email: "tom.anderson@gtt.com", name: "Tom Anderson" },
  { email: "jen.thomas@gtt.com", name: "Jen Thomas" },
  { email: "mark.robinson@gtt.com", name: "Mark Robinson" },
];

const SEARCH_QUERIES = [
  "safari", "beach", "honeymoon", "family trip", "adventure", "luxury",
  "budget travel", "wildlife", "culture", "mountains", "island", "cruise",
  "winter sun", "hiking", "food tour", "solo travel", "wellness", "diving",
  "northern lights", "patagonia", "serengeti", "bali",
];

const FEEDBACK_MESSAGES = [
  { category: "edit-suggestion", message: "Kenya page should mention Amboseli as a pairing destination" },
  { category: "feature-request", message: "Would love a PDF export of destination comparisons" },
  { category: "general", message: "Really helpful tool for client meetings!" },
  { category: "edit-suggestion", message: "Tanzania pricing seems outdated for the luxury tier" },
  { category: "feature-request", message: "Can we add a map view to see all destinations?" },
  { category: "general", message: "The compare feature saved me so much time yesterday" },
  { category: "edit-suggestion", message: "Costa Rica accessibility info needs updating" },
  { category: "feature-request", message: "Notifications when pricing changes would be great" },
];

const CONSULTANTS = [
  { id: "sarah-johnson", name: "Sarah Johnson", destinations: ["kenya", "tanzania", "botswana", "south-africa", "namibia", "rwanda"] },
  { id: "mike-chen", name: "Mike Chen", destinations: ["japan", "thailand", "vietnam", "india", "sri-lanka"] },
  { id: "emily-davis", name: "Emily Davis", destinations: ["costa-rica", "peru", "galapagos", "colombia", "chile"] },
  { id: "james-wilson", name: "James Wilson", destinations: ["iceland", "italy", "croatia", "greece", "portugal"] },
];

// ── Helpers ──────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function isoStr(daysAgo: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, rand(0, 59), 0);
  return d.toISOString();
}

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Seed functions ───────────────────────────────────────

async function seedDailyRollups() {
  console.log("Seeding analytics_daily (60 days)...");
  const batch = db.batch();

  for (let daysAgo = 59; daysAgo >= 0; daysAgo--) {
    const date = dateStr(daysAgo);
    const ref = db.collection("analytics_daily").doc(date);

    // Simulate weekday/weekend pattern — more activity on weekdays
    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const baseViews = isWeekday ? rand(20, 60) : rand(5, 20);

    // Trending up over time (more recent = more views)
    const trendMultiplier = 0.7 + (60 - daysAgo) / 60 * 0.6;
    const totalViews = Math.round(baseViews * trendMultiplier);

    // Pick active users for this day
    const activeUserCount = isWeekday ? rand(3, 8) : rand(1, 4);
    const activeUsers = pickN(USERS, activeUserCount).map(u => u.email);

    // Destination views — weight toward popular ones
    const destViews: Record<string, number> = {};
    const popularDests = DESTINATIONS.slice(0, 8);
    const viewsToDistribute = totalViews;
    let distributed = 0;
    for (const dest of pickN(DESTINATIONS, rand(5, 12))) {
      const weight = popularDests.includes(dest) ? rand(2, 6) : rand(1, 3);
      destViews[dest] = weight;
      distributed += weight;
    }
    // Normalize to roughly match total views
    const scale = viewsToDistribute / Math.max(distributed, 1);
    for (const dest of Object.keys(destViews)) {
      destViews[dest] = Math.max(1, Math.round(destViews[dest] * scale));
    }

    // Searches
    const searches: Record<string, number> = {};
    const searchCount = rand(2, 8);
    for (const q of pickN(SEARCH_QUERIES, searchCount)) {
      searches[q.replace(/\./g, "_")] = rand(1, 5);
    }

    // Zero result searches (occasional)
    const zeroResultSearches: string[] = [];
    if (Math.random() < 0.3) {
      zeroResultSearches.push(pick(["maldievs", "cancun", "hawai", "bali resort"]));
    }

    // Feature usage
    const featureUsage: Record<string, number> = {};
    if (Math.random() < 0.7) featureUsage["compare"] = rand(1, 5);
    if (Math.random() < 0.5) featureUsage["help_me_choose"] = rand(1, 3);

    // Filter usage
    const filterUsage: Record<string, number> = {};
    if (Math.random() < 0.6) filterUsage["season:summer"] = rand(1, 4);
    if (Math.random() < 0.5) filterUsage["season:winter"] = rand(1, 3);
    if (Math.random() < 0.4) filterUsage["budget:luxury"] = rand(1, 3);
    if (Math.random() < 0.3) filterUsage["budget:mid-range"] = rand(1, 2);
    if (Math.random() < 0.5) filterUsage["tag:safari"] = rand(1, 3);
    if (Math.random() < 0.4) filterUsage["tag:beach"] = rand(1, 2);

    // Hourly views — peak at 10am and 2pm
    const hourlyViews: Record<string, number> = {};
    for (let h = 0; h < 24; h++) {
      let hViews = 0;
      if (h >= 8 && h <= 17) {
        hViews = rand(1, 5);
        if (h >= 9 && h <= 11) hViews += rand(1, 4); // morning peak
        if (h >= 13 && h <= 15) hViews += rand(1, 3); // afternoon peak
      } else if (h >= 18 && h <= 21) {
        hViews = rand(0, 2);
      }
      if (hViews > 0) hourlyViews[String(h)] = hViews;
    }

    // Dwell time data
    const dwellMs = totalViews * rand(15000, 45000);
    const dwellCount = totalViews;

    batch.set(ref, {
      date,
      total_page_views: totalViews,
      unique_users: activeUsers,
      destination_views: destViews,
      searches,
      zero_result_searches: zeroResultSearches,
      feature_usage: featureUsage,
      filter_usage: filterUsage,
      hourly_views: hourlyViews,
      destination_dwell_ms: dwellMs,
      destination_dwell_count: dwellCount,
    }, { merge: true });
  }

  await batch.commit();
  console.log("  ✓ 60 daily rollup documents created");
}

async function seedUsers() {
  console.log("Seeding analytics_users...");
  const batch = db.batch();

  for (let i = 0; i < USERS.length; i++) {
    const user = USERS[i];
    const ref = db.collection("analytics_users").doc(user.email);

    // Power users (first 3), regular (next 5), inactive (rest)
    const isPower = i < 3;
    const isRegular = i >= 3 && i < 8;

    const activeDaysCount = isPower ? rand(20, 40) : isRegular ? rand(5, 15) : rand(1, 3);
    const activeDays: string[] = [];
    for (let d = 0; d < activeDaysCount; d++) {
      activeDays.push(dateStr(rand(0, 59)));
    }

    const totalViews = isPower ? rand(100, 300) : isRegular ? rand(20, 80) : rand(2, 15);
    const totalSearches = isPower ? rand(30, 80) : isRegular ? rand(5, 25) : rand(0, 5);

    // Favorite destinations
    const favDests: Record<string, number> = {};
    const favCount = isPower ? rand(8, 15) : isRegular ? rand(3, 7) : rand(1, 3);
    for (const dest of pickN(DESTINATIONS, favCount)) {
      favDests[dest] = rand(1, isPower ? 20 : 8);
    }

    const lastActive = isoStr(isPower ? rand(0, 2) : isRegular ? rand(0, 10) : rand(15, 50), rand(8, 18), rand(0, 59));

    // Session IDs
    const sessionIds: string[] = [];
    for (let s = 0; s < (isPower ? 15 : isRegular ? 5 : 2); s++) {
      sessionIds.push(uuid());
    }

    batch.set(ref, {
      email: user.email,
      name: user.name,
      last_active: lastActive,
      total_page_views: totalViews,
      total_searches: totalSearches,
      active_days: activeDays,
      favorite_destinations: favDests,
      session_ids: sessionIds,
    }, { merge: true });
  }

  await batch.commit();
  console.log(`  ✓ ${USERS.length} user profiles created`);
}

async function seedEventBatches() {
  console.log("Seeding analytics_events (raw batches)...");

  // Create ~40 event batches spread over the last 14 days
  const batchCount = 40;
  const batches: Array<Record<string, unknown>> = [];

  for (let b = 0; b < batchCount; b++) {
    const user = pick(USERS);
    const daysAgo = rand(0, 13);
    const hour = rand(8, 18);
    const sessionId = uuid();

    const events: Array<Record<string, unknown>> = [];

    // Simulate a session: page_view → (search?) → destination views → (compare?) → page_leave
    // 1. Landing page view
    events.push({
      type: "page_view",
      timestamp: isoStr(daysAgo, hour, rand(0, 10)),
      path: "/destinations",
      session_id: sessionId,
    });

    // 2. Maybe a search
    if (Math.random() < 0.6) {
      const query = pick(SEARCH_QUERIES);
      const results = Math.random() < 0.9 ? rand(1, 15) : 0;
      events.push({
        type: "search",
        timestamp: isoStr(daysAgo, hour, rand(11, 15)),
        path: "/search",
        search_query: query,
        search_results: results,
        session_id: sessionId,
      });
    }

    // 3. View 1-3 destinations
    const viewCount = rand(1, 3);
    for (let v = 0; v < viewCount; v++) {
      const dest = pick(DESTINATIONS);
      events.push({
        type: "page_view",
        timestamp: isoStr(daysAgo, hour, rand(16 + v * 5, 20 + v * 5)),
        path: `/destinations/${dest}`,
        destination: dest,
        session_id: sessionId,
      });

      // Page leave for previous page
      if (v > 0) {
        events.push({
          type: "page_leave",
          timestamp: isoStr(daysAgo, hour, rand(16 + v * 5, 17 + v * 5)),
          path: `/destinations/${DESTINATIONS[rand(0, DESTINATIONS.length - 1)]}`,
          dwell_ms: rand(10000, 120000),
          session_id: sessionId,
        });
      }
    }

    // 4. Maybe compare or help-me-choose
    if (Math.random() < 0.3) {
      events.push({
        type: "compare",
        timestamp: isoStr(daysAgo, hour, rand(35, 40)),
        path: "/compare",
        session_id: sessionId,
      });
    }
    if (Math.random() < 0.2) {
      events.push({
        type: "help_me_choose",
        timestamp: isoStr(daysAgo, hour, rand(41, 45)),
        path: "/help-me-choose",
        session_id: sessionId,
      });
    }

    // 5. Maybe filter usage
    if (Math.random() < 0.4) {
      events.push({
        type: "filter_season",
        timestamp: isoStr(daysAgo, hour, rand(12, 14)),
        path: "/destinations",
        filter_type: "season",
        filter_value: pick(["summer", "winter", "spring", "fall"]),
        session_id: sessionId,
      });
    }

    // 6. Final page_leave
    events.push({
      type: "page_leave",
      timestamp: isoStr(daysAgo, hour, rand(46, 59)),
      path: events[events.length - 1].path as string,
      dwell_ms: rand(5000, 60000),
      session_id: sessionId,
    });

    batches.push({
      user_email: user.email,
      user_name: user.name,
      flushed_at: isoStr(daysAgo, hour, 59),
      events,
    });
  }

  // Write in chunks of 20 (Firestore batch limit is 500 ops)
  for (let i = 0; i < batches.length; i += 20) {
    const chunk = batches.slice(i, i + 20);
    const fbBatch = db.batch();
    for (const batch of chunk) {
      const ref = db.collection("analytics_events").doc();
      fbBatch.set(ref, batch);
    }
    await fbBatch.commit();
  }

  console.log(`  ✓ ${batchCount} event batches created`);
}

async function seedBookingClicks() {
  console.log("Seeding booking-clicks...");
  const batch = db.batch();

  for (const consultant of CONSULTANTS) {
    const ref = db.collection("booking-clicks").doc(consultant.id);
    const clicks: string[] = [];

    // Generate clicks over the last 60 days
    const clickCount = rand(5, 25);
    for (let c = 0; c < clickCount; c++) {
      clicks.push(isoStr(rand(0, 59), rand(8, 18), rand(0, 59)));
    }

    batch.set(ref, {
      id: consultant.id,
      name: consultant.name,
      clicks,
    }, { merge: true });
  }

  await batch.commit();
  console.log(`  ✓ ${CONSULTANTS.length} consultant booking-click docs created`);
}

async function seedFeedback() {
  console.log("Seeding feedback...");
  const batch = db.batch();

  for (let i = 0; i < FEEDBACK_MESSAGES.length; i++) {
    const fb = FEEDBACK_MESSAGES[i];
    const user = USERS[i % USERS.length];
    const daysAgo = rand(1, 45);
    const ref = db.collection("feedback").doc();

    batch.set(ref, {
      user_name: user.name,
      user_email: user.email,
      category: fb.category,
      message: fb.message,
      page_url: Math.random() < 0.5 ? `/destinations/${pick(DESTINATIONS)}` : null,
      status: pick(["new", "reviewed", "new"]),
      admin_notes: null,
      created_at: isoStr(daysAgo, rand(8, 18), rand(0, 59)),
      updated_at: isoStr(daysAgo, rand(8, 18), rand(0, 59)),
    });
  }

  await batch.commit();
  console.log(`  ✓ ${FEEDBACK_MESSAGES.length} feedback items created`);
}

async function cleanSeededData() {
  console.log("Cleaning existing analytics data...");

  const collections = ["analytics_daily", "analytics_users", "analytics_events"];
  for (const col of collections) {
    const snap = await db.collection(col).limit(500).get();
    if (snap.empty) continue;
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`  ✓ Deleted ${snap.size} docs from ${col}`);
  }

  // Clean seeded booking-clicks (only our test consultants)
  for (const c of CONSULTANTS) {
    const ref = db.collection("booking-clicks").doc(c.id);
    const doc = await ref.get();
    if (doc.exists) {
      await ref.delete();
    }
  }
  console.log("  ✓ Cleaned booking-clicks for test consultants");
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const shouldClean = process.argv.includes("--clean");

  if (shouldClean) {
    await cleanSeededData();
  }

  await seedDailyRollups();
  await seedUsers();
  await seedEventBatches();
  await seedBookingClicks();
  await seedFeedback();

  console.log("\n✅ Analytics seed data complete!");
  console.log("   Visit /admin/analytics to see the dashboard.");
}

main().catch(err => {
  console.error("Failed to seed analytics:", err);
  process.exit(1);
});

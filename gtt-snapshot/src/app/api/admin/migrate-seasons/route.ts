import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { invalidateCache } from "@/lib/data-cache";

// Month → season mapping
const MONTH_TO_SEASON: Record<number, string> = {
  12: 'winter', 1: 'winter', 2: 'winter', 3: 'winter',
  4: 'spring', 5: 'spring', 6: 'spring',
  7: 'summer', 8: 'summer', 9: 'summer',
  10: 'fall', 11: 'fall',
};

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function parseMonth(str: string): number | null {
  const cleaned = str.trim().toLowerCase().replace(/[.,]/g, '');
  return MONTH_NAMES[cleaned] ?? null;
}

function monthsInRange(startMonth: number, endMonth: number): number[] {
  const months: number[] = [];
  let m = startMonth;
  for (let i = 0; i < 12; i++) {
    months.push(m);
    if (m === endMonth) break;
    m = m === 12 ? 1 : m + 1;
  }
  return months;
}

function extractMonthsFromDateRange(dateRange: string): number[] {
  const months: number[] = [];

  // Split on & / , / and / + to handle compound ranges like "May/June & Nov"
  const segments = dateRange.split(/[&,+]|(?:\band\b)/i).map(s => s.trim()).filter(Boolean);

  for (const segment of segments) {
    // Try range pattern: "June-Oct", "Dec - March", "May/June"
    const rangeMatch = segment.match(/([A-Za-z]+)\s*[-–—\/]\s*([A-Za-z]+)/);
    if (rangeMatch) {
      const start = parseMonth(rangeMatch[1]);
      const end = parseMonth(rangeMatch[2]);
      if (start && end) {
        months.push(...monthsInRange(start, end));
        continue;
      }
    }

    // Try single month: "November", "Jun"
    const words = segment.split(/[\s\/]+/);
    for (const word of words) {
      const m = parseMonth(word);
      if (m) months.push(m);
    }
  }

  return [...new Set(months)];
}

function monthsToSeasons(months: number[]): string[] {
  const seasons = new Set<string>();
  for (const m of months) {
    const s = MONTH_TO_SEASON[m];
    if (s) seasons.add(s);
  }
  return [...seasons];
}

interface SeasonalityEntry {
  level: string;
  date_range: string;
  description?: string;
}

function parseBestSeasons(seasonalityJson: string): { seasons: string[]; needsReview: boolean } {
  let entries: SeasonalityEntry[];
  try {
    entries = JSON.parse(seasonalityJson);
  } catch {
    return { seasons: [], needsReview: true };
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return { seasons: [], needsReview: false };
  }

  // Check for "Year-round" level
  const yearRound = entries.some(e =>
    e.level?.toLowerCase().includes('year-round') ||
    e.level?.toLowerCase().includes('year round')
  );
  if (yearRound) {
    return { seasons: ['winter', 'spring', 'summer', 'fall'], needsReview: false };
  }

  const allMonths: number[] = [];
  let hadUnparseable = false;

  for (const entry of entries) {
    const level = (entry.level || '').toLowerCase();
    // Skip "Low" season — only use Peak, High, and Shoulder
    if (level === 'low') continue;

    const dateRange = entry.date_range || '';
    if (!dateRange) continue;

    const months = extractMonthsFromDateRange(dateRange);
    if (months.length === 0 && dateRange.length > 0) {
      hadUnparseable = true;
    }
    allMonths.push(...months);
  }

  const seasons = monthsToSeasons(allMonths);
  return { seasons, needsReview: hadUnparseable && seasons.length === 0 };
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

    const snap = await getDb().collection("destinations").get();
    let migrated = 0;
    let skipped = 0;
    const needsReview: { name: string; slug: string; seasonality: string }[] = [];
    const details: { name: string; slug: string; seasons: string[]; source: string }[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const name = data.name as string;
      const existing: string[] = data.best_seasons ?? [];

      // Skip if already has best_seasons set
      if (existing.length > 0) {
        skipped++;
        details.push({ name, slug: doc.id, seasons: existing, source: "existing" });
        continue;
      }

      const seasonalityStr = data.seasonality as string | null;
      if (!seasonalityStr) {
        skipped++;
        continue;
      }

      const { seasons, needsReview: flagReview } = parseBestSeasons(seasonalityStr);

      if (flagReview) {
        needsReview.push({ name, slug: doc.id, seasonality: seasonalityStr });
      }

      if (seasons.length > 0) {
        if (!dryRun) {
          await doc.ref.update({ best_seasons: seasons });
        }
        migrated++;
        details.push({ name, slug: doc.id, seasons, source: "parsed" });
      } else {
        skipped++;
      }
    }

    if (!dryRun) {
      invalidateCache();
    }

    return NextResponse.json({
      success: true,
      dryRun,
      migrated,
      skipped,
      needsReview: needsReview.sort((a, b) => a.name.localeCompare(b.name)),
      details: details.sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

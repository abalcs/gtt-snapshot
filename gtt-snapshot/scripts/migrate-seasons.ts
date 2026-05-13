import { getDb } from '../db/database';

const MONTH_TO_SEASON: Record<number, string> = {
  12: 'winter', 1: 'winter', 2: 'winter', 3: 'winter',
  4: 'spring', 5: 'spring', 6: 'spring',
  7: 'summer', 8: 'summer', 9: 'summer',
  10: 'fall', 11: 'fall',
};

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function parseMonth(str: string): number | null {
  const cleaned = str.trim().toLowerCase().replace(/[.,]/g, '');
  return MONTH_NAMES[cleaned] ?? null;
}

function monthsInRange(start: number, end: number): number[] {
  const months: number[] = [];
  let m = start;
  for (let i = 0; i < 12; i++) {
    months.push(m);
    if (m === end) break;
    m = m === 12 ? 1 : m + 1;
  }
  return months;
}

function extractMonths(dateRange: string): number[] {
  const months: number[] = [];
  const segments = dateRange.split(/[&,+]|(?:\band\b)/i).map(s => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const rangeMatch = seg.match(/([A-Za-z]+)\s*[-–—\/]\s*([A-Za-z]+)/);
    if (rangeMatch) {
      const s = parseMonth(rangeMatch[1]);
      const e = parseMonth(rangeMatch[2]);
      if (s && e) { months.push(...monthsInRange(s, e)); continue; }
    }
    for (const word of seg.split(/[\s\/]+/)) {
      const m = parseMonth(word);
      if (m) months.push(m);
    }
  }
  return [...new Set(months)];
}

function monthsToSeasons(months: number[]): string[] {
  const seasons = new Set<string>();
  for (const m of months) { const s = MONTH_TO_SEASON[m]; if (s) seasons.add(s); }
  return [...seasons];
}

interface Entry { level: string; date_range: string; }

function parseBestSeasons(json: string): { seasons: string[]; needsReview: boolean } {
  let entries: Entry[];
  try { entries = JSON.parse(json); } catch { return { seasons: [], needsReview: true }; }
  if (!Array.isArray(entries) || entries.length === 0) return { seasons: [], needsReview: false };

  if (entries.some(e => e.level?.toLowerCase().includes('year-round') || e.level?.toLowerCase().includes('year round'))) {
    return { seasons: ['winter', 'spring', 'summer', 'fall'], needsReview: false };
  }

  const allMonths: number[] = [];
  let hadUnparseable = false;
  for (const entry of entries) {
    if ((entry.level || '').toLowerCase() === 'low') continue;
    const dr = entry.date_range || '';
    if (!dr) continue;
    const months = extractMonths(dr);
    if (months.length === 0 && dr.length > 0) hadUnparseable = true;
    allMonths.push(...months);
  }

  const seasons = monthsToSeasons(allMonths);
  return { seasons, needsReview: hadUnparseable && seasons.length === 0 };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDb();
  const snap = await db.collection('destinations').get();

  let migrated = 0, skipped = 0;
  const review: string[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const name = data.name as string;
    const existing: string[] = data.best_seasons ?? [];

    if (existing.length > 0) { skipped++; continue; }

    const json = data.seasonality as string | null;
    if (!json) { skipped++; continue; }

    const { seasons, needsReview } = parseBestSeasons(json);
    if (needsReview) review.push(name);

    if (seasons.length > 0) {
      console.log(`  ${name}: ${seasons.join(', ')}`);
      if (!dryRun) await doc.ref.update({ best_seasons: seasons });
      migrated++;
    } else {
      skipped++;
    }
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Migrated: ${migrated}, Skipped: ${skipped}`);
  if (review.length > 0) console.log('Needs manual review:', review.join(', '));
  process.exit(0);
}

main();

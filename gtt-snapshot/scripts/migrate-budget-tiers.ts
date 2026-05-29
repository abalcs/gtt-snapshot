import { getDb } from '../db/database';

/**
 * Migration: Assign budget_tiers to all destinations based on the
 * Destination Pricing Guide PDF tier assignments.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json npx tsx scripts/migrate-budget-tiers.ts --dry-run
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json npx tsx scripts/migrate-budget-tiers.ts
 */

// Tier assignments derived from the Destination Pricing Guide PDF.
// Key = destination name (case-insensitive match against Firestore `name` field).
// Value = array of budget tier slugs.
const TIER_MAP: Record<string, string[]> = {
  // ── Best Value (Under $5k/week) ──
  'Cambodia':          ['best-value'],
  'Vietnam':           ['best-value'],
  'Indonesia / Bali':  ['best-value'],
  'Indonesia':         ['best-value'],
  'Malaysia':          ['best-value'],
  'Malaysian Borneo':  ['best-value'],
  'Laos':              ['best-value'],
  'Thailand':          ['best-value'],
  'Myanmar':           ['best-value'],
  'Nepal':             ['best-value'],
  'India':             ['best-value'],
  'Sri Lanka':         ['best-value'],
  'Colombia':          ['best-value'],
  'Mexico':            ['best-value'],
  'Uruguay':           ['best-value'],
  'Paraguay':          ['best-value'],
  'Jordan':            ['best-value'],
  'Egypt':             ['best-value'],
  'Czech Republic':    ['best-value'],
  'Czech Republic (Prague)': ['best-value'],
  'Hungary':           ['best-value'],
  'Hungary (Budapest)':['best-value'],
  'Mauritius':         ['best-value'],
  'Zanzibar':          ['best-value'],
  'Seychelles':        ['best-value'],
  'South Korea':       ['best-value'],
  'Philippines':       ['best-value'],
  'Cuba':              ['best-value'],
  'Honduras':          ['best-value'],
  'Singapore':         ['best-value'],

  // ── Mid-Range ($5k–$8k/week) ──
  'Costa Rica':        ['mid-range'],
  'Peru':              ['mid-range'],
  'Belize':            ['mid-range'],
  'Guatemala':         ['mid-range'],
  'Brazil':            ['mid-range'],
  'Argentina':         ['mid-range'],
  'Ecuador':           ['mid-range'],
  'Bolivia':           ['mid-range'],
  'Canada (East)':     ['mid-range'],
  'Panama':            ['mid-range'],
  'Chile':             ['mid-range', 'premium'],
  'USA – New England': ['mid-range'],
  'USA - New England': ['mid-range'],
  'Greece':            ['mid-range'],
  'Belgium':           ['mid-range'],
  'Netherlands':       ['mid-range'],
  'Luxembourg':        ['mid-range'],
  'Switzerland':       ['mid-range'],
  'Spain':             ['mid-range'],
  'Portugal':          ['mid-range'],
  'Turkey':            ['mid-range'],
  'Iceland':           ['mid-range'],
  'Germany':           ['mid-range', 'premium'],
  'Austria':           ['mid-range', 'premium'],
  'Sweden':            ['mid-range', 'premium'],
  'Azores':            ['mid-range'],
  'Sardinia':          ['premium'],
  'China':             ['mid-range'],
  'Cook Islands':      ['mid-range'],
  'Fiji':              ['mid-range'],
  'Malawi':            ['mid-range'],
  'Uganda':            ['mid-range'],
  'Morocco':           ['mid-range'],
  'Zimbabwe':          ['mid-range', 'premium'],
  'UAE':               ['mid-range', 'premium'],
  'Uzbekistan':        ['mid-range'],
  'Kyrgyzstan':        ['mid-range'],
  'The Stans':         ['mid-range'],
  'Tibet':             ['mid-range'],

  // ── Mid-Range + straddling tiers ──
  'Japan':             ['mid-range', 'premium'],
  'Maldives':          ['mid-range'],
  'South Africa':      ['mid-range', 'premium'],
  'Botswana':          ['mid-range'],

  // ── Premium ($8k+/week) ──
  'Tanzania':          ['premium'],
  'Rwanda':            ['premium'],
  'Kenya':             ['premium'],
  'Zambia':            ['premium'],
  'Namibia':           ['mid-range', 'premium'],
  'Madagascar':        ['mid-range', 'premium'],
  'Italy':             ['premium'],
  'France':            ['premium'],
  'Croatia':           ['premium'],
  'Norway':            ['premium'],
  'Denmark':           ['premium'],
  'England':           ['premium'],
  'Scotland':          ['premium'],
  'Ireland':           ['premium'],
  'Israel':            ['premium'],
  'Bhutan':            ['premium'],
  'Galapagos':         ['premium'],
  'Canada (West)':     ['premium'],
  'USA – Alaska':      ['premium'],
  'USA - Alaska':      ['premium'],
  'USA – California':  ['mid-range', 'premium'],
  'USA - California':  ['mid-range', 'premium'],
  'USA – Hawaii':      ['premium'],
  'USA - Hawaii':      ['premium'],
  "USA – Nat'l Parks": ['mid-range', 'premium'],
  'USA – National Parks': ['mid-range', 'premium'],
  'USA - National Parks': ['mid-range', 'premium'],
  'Antarctica':        ['premium'],
  'French Polynesia':  ['premium'],
  'Australia':         ['mid-range', 'premium'],
  'New Zealand':       ['mid-range', 'premium'],
  'Oman':              ['mid-range', 'premium'],
  'Arctic Svalbard':   ['premium'],
  'Orient Express / Trains': ['premium'],
  'River Cruises':     ['mid-range', 'premium'],
  'Multi-Country Trips': ['mid-range'],
};

// Build a case-insensitive lookup
const tierLookup = new Map<string, string[]>();
for (const [name, tiers] of Object.entries(TIER_MAP)) {
  tierLookup.set(name.toLowerCase(), tiers);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDb();
  const snap = await db.collection('destinations').get();

  let migrated = 0;
  let skipped = 0;
  let alreadySet = 0;
  const unmatched: string[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const name = data.name as string;
    const existing: string[] = data.budget_tiers ?? [];

    // Skip if already has budget tiers
    if (existing.length > 0) {
      alreadySet++;
      continue;
    }

    const tiers = tierLookup.get(name.toLowerCase());
    if (!tiers) {
      unmatched.push(name);
      skipped++;
      continue;
    }

    console.log(`  ${name}: ${tiers.join(', ')}`);
    if (!dryRun) {
      await doc.ref.update({ budget_tiers: tiers });
    }
    migrated++;
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Migrated: ${migrated}, Already set: ${alreadySet}, Skipped: ${skipped}`);
  if (unmatched.length > 0) {
    console.log(`\nNo tier mapping for (${unmatched.length}):`);
    for (const name of unmatched.sort()) {
      console.log(`  - ${name}`);
    }
  }
  process.exit(0);
}

main();

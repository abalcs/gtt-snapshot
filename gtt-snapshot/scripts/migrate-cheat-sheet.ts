/**
 * Migration: Migrate Activity Cheat Sheet categories into Help Me Choose tags,
 * then delete the cheat sheet special section.
 *
 * Creates 4 new tag docs, adds them to destination tags[] arrays, and removes
 * the activity-cheat-sheet special section from Firestore.
 *
 * Usage:
 *   npx tsx scripts/migrate-cheat-sheet.ts --dry-run
 *   npx tsx scripts/migrate-cheat-sheet.ts
 */

import { getDb } from '../db/database';
import { FieldValue } from 'firebase-admin/firestore';

// ── New tags to create ──────────────────────────────────────

const NEW_TAGS = [
  { slug: 'cruising', label: 'Cruising', category: 'activities' },
  { slug: 'self-drive', label: 'Self-Drive', category: 'activities' },
  { slug: 'nightlife-and-drinks', label: 'Nightlife & Drinks', category: 'trip-style' },
  { slug: 'all-inclusive', label: 'All-Inclusive', category: 'trip-style' },
];

// ── Tag → destination slugs mapping ─────────────────────────

const TAG_DESTINATIONS: Record<string, string[]> = {
  cruising: [
    'seychelles', 'south-africa', 'australia', 'croatia', 'cook-islands',
    'french-polynesia', 'greece', 'india', 'usa-hawaii', 'indonesia',
    'italy', 'japan', 'antarctica', 'new-zealand', 'arctic-svalbard',
    'canada-east', 'canada-west', 'germany',
  ],
  'self-drive': [
    'botswana', 'india', 'south-africa', 'namibia', 'costa-rica', 'egypt',
    'australia', 'argentina', 'jordan', 'peru', 'chile', 'china', 'japan',
    'new-zealand', 'canada-east', 'canada-west', 'colombia', 'ecuador',
    'bolivia', 'oman', 'vietnam', 'thailand', 'iceland', 'cook-islands',
    'ireland', 'mexico', 'galapagos', 'brazil', 'uruguay',
  ],
  'nightlife-and-drinks': [
    'spain', 'croatia', 'morocco', 'germany', 'maldives', 'ireland', 'england',
  ],
  'all-inclusive': [
    'french-polynesia', 'maldives', 'cook-islands',
  ],
};

const CHEAT_SHEET_DOC_ID = 'activity-cheat-sheet';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDb();

  if (dryRun) console.log('[DRY RUN]\n');

  // 1. Create tag documents
  console.log('Creating tag documents...');
  for (const tag of NEW_TAGS) {
    const ref = db.collection('tags').doc(tag.slug);
    const existing = await ref.get();
    if (existing.exists) {
      console.log(`  ${tag.slug}: already exists, updating`);
    } else {
      console.log(`  ${tag.slug}: creating`);
    }
    if (!dryRun) {
      await ref.set({ label: tag.label, category: tag.category }, { merge: true });
    }
  }

  // 2. Tag destinations
  console.log('\nTagging destinations...');
  let totalTagged = 0;
  const missing: string[] = [];

  for (const [tagSlug, destSlugs] of Object.entries(TAG_DESTINATIONS)) {
    console.log(`\n  [${tagSlug}]`);
    for (const destSlug of destSlugs) {
      const ref = db.collection('destinations').doc(destSlug);
      const doc = await ref.get();
      if (!doc.exists) {
        console.log(`    ${destSlug}: NOT FOUND`);
        missing.push(`${tagSlug} → ${destSlug}`);
        continue;
      }
      const currentTags: string[] = doc.data()?.tags ?? [];
      if (currentTags.includes(tagSlug)) {
        console.log(`    ${destSlug}: already tagged`);
        continue;
      }
      console.log(`    ${destSlug}: adding tag`);
      if (!dryRun) {
        await ref.update({ tags: FieldValue.arrayUnion(tagSlug) });
      }
      totalTagged++;
    }
  }

  // 3. Delete the cheat sheet special section
  console.log('\nDeleting activity-cheat-sheet special section...');
  const cheatRef = db.collection('special_sections').doc(CHEAT_SHEET_DOC_ID);
  const cheatDoc = await cheatRef.get();
  if (cheatDoc.exists) {
    console.log('  Found — deleting');
    if (!dryRun) {
      await cheatRef.delete();
    }
  } else {
    console.log('  Not found (already deleted?)');
  }

  // Summary
  console.log('\n── Summary ──');
  console.log(`Tags created/updated: ${NEW_TAGS.length}`);
  console.log(`Destination-tag assignments: ${totalTagged}`);
  if (missing.length > 0) {
    console.log(`Missing destinations (${missing.length}):`);
    for (const m of missing) {
      console.log(`  - ${m}`);
    }
  }
  if (dryRun) console.log('\n[DRY RUN — no changes written]');

  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

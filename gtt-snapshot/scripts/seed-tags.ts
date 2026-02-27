/**
 * One-time migration: seeds the 26 hardcoded tags into the Firestore `tags` collection.
 *
 * Usage:
 *   npx tsx scripts/seed-tags.ts
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON env var.
 */

import { getDb } from '../db/database';
import { ALL_TAGS } from '../src/lib/tags';

async function seedTags() {
  const db = getDb();
  const batch = db.batch();

  for (const tag of ALL_TAGS) {
    const ref = db.collection('tags').doc(tag.slug);
    batch.set(ref, { label: tag.label, category: tag.category }, { merge: true });
  }

  await batch.commit();
  console.log(`Seeded ${ALL_TAGS.length} tags into Firestore 'tags' collection.`);
}

seedTags().catch((err) => {
  console.error('Failed to seed tags:', err);
  process.exit(1);
});

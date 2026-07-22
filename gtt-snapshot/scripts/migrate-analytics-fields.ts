/**
 * One-time migration: Convert flat dot-notation fields in analytics_daily
 * and analytics_users documents into proper nested objects.
 *
 * Firestore set-with-merge was creating "destination_views.italy": 1 as a
 * flat top-level field instead of destination_views: { italy: 1 }.
 *
 * Uses FieldPath to handle fields whose names literally contain dots.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, FieldPath } from 'firebase-admin/firestore';

if (getApps().length === 0) initializeApp();
const db = getFirestore();

const NESTED_PREFIXES = [
  'destination_views',
  'hourly_views',
  'searches',
  'feature_usage',
  'filter_usage',
];

async function migrateDailyDocs() {
  const snap = await db.collection('analytics_daily').get();
  console.log(`Found ${snap.size} analytics_daily documents`);

  for (const doc of snap.docs) {
    if (doc.id === '_test_') continue;
    const data = doc.data();
    let hasChanges = false;

    for (const prefix of NESTED_PREFIXES) {
      const dotPrefix = prefix + '.';
      const flatFields: Record<string, number> = {};

      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(dotPrefix) && typeof value === 'number') {
          const subKey = key.slice(dotPrefix.length);
          flatFields[subKey] = value;
        }
      }

      if (Object.keys(flatFields).length === 0) continue;
      hasChanges = true;

      // Merge into nested object
      const existing = (typeof data[prefix] === 'object' && data[prefix] !== null && !Array.isArray(data[prefix]))
        ? (data[prefix] as Record<string, number>)
        : {};
      const merged: Record<string, number> = { ...existing };
      for (const [k, v] of Object.entries(flatFields)) {
        merged[k] = (merged[k] ?? 0) + v;
      }

      // Write the merged nested object
      await doc.ref.set({ [prefix]: merged }, { merge: true });

      // Delete each flat field using FieldPath (literal field name with dot)
      for (const key of Object.keys(data)) {
        if (key.startsWith(dotPrefix) && typeof data[key] === 'number') {
          await doc.ref.update(
            new FieldPath(key), FieldValue.delete()
          );
        }
      }
    }

    console.log(`  ${doc.id}: ${hasChanges ? 'migrated' : 'no flat fields'}`);
  }
}

async function migrateUserDocs() {
  const snap = await db.collection('analytics_users').get();
  console.log(`\nFound ${snap.size} analytics_users documents`);

  for (const doc of snap.docs) {
    const data = doc.data();
    const dotPrefix = 'favorite_destinations.';
    const flatFields: Record<string, number> = {};

    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(dotPrefix) && typeof value === 'number') {
        const subKey = key.slice(dotPrefix.length);
        flatFields[subKey] = value;
      }
    }

    if (Object.keys(flatFields).length === 0) {
      console.log(`  ${doc.id}: no flat fields`);
      continue;
    }

    // Merge into nested object
    const existing = (typeof data.favorite_destinations === 'object' && data.favorite_destinations !== null && !Array.isArray(data.favorite_destinations))
      ? (data.favorite_destinations as Record<string, number>)
      : {};
    const merged: Record<string, number> = { ...existing };
    for (const [k, v] of Object.entries(flatFields)) {
      merged[k] = (merged[k] ?? 0) + v;
    }

    // Write merged nested object
    await doc.ref.set({ favorite_destinations: merged }, { merge: true });

    // Delete flat fields
    for (const key of Object.keys(data)) {
      if (key.startsWith(dotPrefix) && typeof data[key] === 'number') {
        await doc.ref.update(
          new FieldPath(key), FieldValue.delete()
        );
      }
    }

    console.log(`  ${doc.id}: migrated ${Object.keys(flatFields).length} fields`);
  }
}

async function main() {
  console.log('=== Migrating flat dot-notation fields to nested objects ===\n');
  await migrateDailyDocs();
  await migrateUserDocs();
  console.log('\nDone!');
}

main().catch(console.error);

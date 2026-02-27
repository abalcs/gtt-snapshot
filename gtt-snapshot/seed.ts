import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';

// Initialize Firebase Admin
const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (saJson) {
  const sa: ServiceAccount = JSON.parse(saJson);
  initializeApp({ credential: cert(sa) });
} else {
  initializeApp();
}

const db = getFirestore();

const SEED_FILES = [
  'anz-pacific.json',
  'africa.json',
  'asia.json',
  'canal.json',
  'ese.json',
  'wemea.json',
  'middle-east.json',
];

interface SeedDestination {
  name: string;
  slug: string;
  night_min?: string | null;
  key_facts?: string | null;
  urgency?: string | null;
  solo_pricing?: string | null;
  pax_limit?: string | null;
  accommodations?: string | null;
  how_to_feature?: string | null;
  pair_with?: string | null;
  general_notes_1?: string | null;
  general_notes_2?: string | null;
  client_types_good?: string | null;
  client_types_okay?: string | null;
  client_types_bad?: string | null;
  seasonality?: Array<{ level: string; date_range: string; description: string }> | null;
  pricing_tiers?: Array<{ tier_label: string; price_per_week?: string | null; price_per_day?: string | null; notes?: string | null }>;
  status?: string;
}

function generateSearchTokens(dest: SeedDestination, regionName: string): string[] {
  const fields = [
    dest.name,
    dest.key_facts,
    dest.urgency,
    dest.accommodations,
    dest.client_types_good,
    dest.client_types_okay,
    dest.client_types_bad,
    dest.general_notes_1,
    dest.general_notes_2,
    dest.pair_with,
    regionName,
  ];

  const tokenSet = new Set<string>();
  for (const field of fields) {
    if (!field) continue;
    const words = field.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/);
    for (const word of words) {
      const trimmed = word.trim();
      if (trimmed.length >= 2) {
        tokenSet.add(trimmed);
      }
    }
  }
  return Array.from(tokenSet);
}

async function deleteCollection(collectionPath: string) {
  const snap = await db.collection(collectionPath).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`  Deleted ${snap.size} docs from ${collectionPath}`);
}

async function seed() {
  console.log('Seeding Firestore...\n');

  // Clear existing data
  console.log('Clearing existing collections...');
  await deleteCollection('regions');
  await deleteCollection('destinations');
  await deleteCollection('special_sections');
  console.log('');

  let totalDestinations = 0;
  let totalTiers = 0;

  for (let i = 0; i < SEED_FILES.length; i++) {
    const file = SEED_FILES[i];
    const filePath = path.join(__dirname, 'db', 'seed-data', file);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    const region = data.region;

    // Write region doc (slug as document ID)
    await db.collection('regions').doc(region.slug).set({
      name: region.name,
      slug: region.slug,
      description: region.description || null,
      sort_order: i + 1,
    });

    console.log(`Region: ${region.name} (${region.slug})`);

    // Write destinations
    const destinations: SeedDestination[] = data.destinations || [];
    const batch = db.batch();

    for (const dest of destinations) {
      const seasonalityStr = dest.seasonality ? JSON.stringify(dest.seasonality) : null;
      const pricingTiers = (dest.pricing_tiers || []).map((t, idx) => ({
        tier_label: t.tier_label,
        price_per_week: t.price_per_week || null,
        price_per_day: t.price_per_day || null,
        notes: t.notes || null,
        sort_order: idx,
      }));

      const now = new Date().toISOString();
      const ref = db.collection('destinations').doc(dest.slug);
      batch.set(ref, {
        name: dest.name,
        slug: dest.slug,
        region_name: region.name,
        region_slug: region.slug,
        night_min: dest.night_min || null,
        key_facts: dest.key_facts || null,
        urgency: dest.urgency || null,
        solo_pricing: dest.solo_pricing || null,
        pax_limit: dest.pax_limit || null,
        accommodations: dest.accommodations || null,
        how_to_feature: dest.how_to_feature || null,
        pair_with: dest.pair_with || null,
        general_notes_1: dest.general_notes_1 || null,
        general_notes_2: dest.general_notes_2 || null,
        client_types_good: dest.client_types_good || null,
        client_types_okay: dest.client_types_okay || null,
        client_types_bad: dest.client_types_bad || null,
        seasonality: seasonalityStr,
        status: dest.status || 'active',
        date_updated: null,
        updated_by: null,
        cs_rsm_source: null,
        summary_of_changes: null,
        created_at: now,
        updated_at: now,
        pricing_tiers: pricingTiers,
        search_tokens: generateSearchTokens(dest, region.name),
      });

      totalDestinations++;
      totalTiers += pricingTiers.length;
    }

    await batch.commit();
    console.log(`  -> ${destinations.length} destinations`);
  }

  // Seed special sections
  const specialPath = path.join(__dirname, 'db', 'seed-data', 'special-sections.json');
  const specialData = JSON.parse(readFileSync(specialPath, 'utf-8'));
  const sections = specialData.sections || [];

  if (sections.length > 0) {
    const batch = db.batch();
    for (const section of sections) {
      const ref = db.collection('special_sections').doc(section.slug);
      batch.set(ref, {
        title: section.title,
        slug: section.slug,
        content: section.content,
        region_scope: section.region_scope || null,
      });
    }
    await batch.commit();
  }

  console.log(`\nSpecial sections: ${sections.length}`);
  console.log(`\nTotal: ${totalDestinations} destinations, ${totalTiers} pricing tiers`);
  console.log('\nDone!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

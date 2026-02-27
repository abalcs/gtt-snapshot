/**
 * Auto-tag script: assigns curated tags to destinations based on
 * manual review of each destination's key_facts, client_types,
 * general_notes, and other content fields.
 *
 * Usage:
 *   npx tsx scripts/auto-tag.ts           # writes tags to Firestore
 *   npx tsx scripts/auto-tag.ts --dry-run # preview only
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (saJson) {
  const sa: ServiceAccount = JSON.parse(saJson);
  initializeApp({ credential: cert(sa) });
} else {
  initializeApp();
}

const db = getFirestore();

// Curated tag assignments based on review of all destination content.
// Each destination gets up to 8 tags, prioritized by strongest fit.
const TAG_ASSIGNMENTS: Record<string, string[]> = {
  // ── Africa ──────────────────────────────────────────
  'botswana': ['safari-and-wildlife', 'off-the-beaten-path', 'birding', 'photography', 'bucket-list', 'adventure-and-outdoors'],
  'kenya': ['safari-and-wildlife', 'beaches-and-coast', 'honeymoon-and-romance', 'family-friendly', 'solo-traveler', 'photography', 'bucket-list'],
  'mauritius': ['beaches-and-coast', 'diving-and-snorkeling', 'honeymoon-and-romance', 'family-friendly', 'hiking-and-trekking', 'tropical-islands', 'photography', 'water-sports'],
  'namibia': ['safari-and-wildlife', 'adventure-and-outdoors', 'desert-and-dunes', 'off-the-beaten-path', 'photography', 'birding'],
  'madagascar': ['hiking-and-trekking', 'off-the-beaten-path', 'beaches-and-coast', 'whale-watching', 'birding', 'solo-traveler', 'adventure-and-outdoors'],
  'malawi': ['beaches-and-coast', 'diving-and-snorkeling', 'birding', 'honeymoon-and-romance', 'off-the-beaten-path'],
  'south-africa': ['safari-and-wildlife', 'food-and-wine', 'adventure-and-outdoors', 'honeymoon-and-romance', 'family-friendly', 'whale-watching', 'first-international-trip', 'beaches-and-coast'],
  'rwanda': ['safari-and-wildlife', 'hiking-and-trekking', 'off-the-beaten-path', 'bucket-list', 'photography'],
  'tanzania': ['safari-and-wildlife', 'adventure-and-outdoors', 'hiking-and-trekking', 'beaches-and-coast', 'bucket-list', 'family-friendly'],
  'zanzibar': ['beaches-and-coast', 'cultural-immersion', 'honeymoon-and-romance', 'diving-and-snorkeling', 'off-the-beaten-path', 'tropical-islands'],
  'seychelles': ['beaches-and-coast', 'diving-and-snorkeling', 'honeymoon-and-romance', 'family-friendly', 'luxury', 'tropical-islands'],
  'uganda': ['safari-and-wildlife', 'hiking-and-trekking', 'adventure-and-outdoors', 'family-friendly', 'off-the-beaten-path', 'water-sports'],
  'zambia': ['safari-and-wildlife', 'birding', 'adventure-and-outdoors', 'family-friendly', 'off-the-beaten-path', 'water-sports'],
  'zimbabwe': ['safari-and-wildlife', 'off-the-beaten-path', 'adventure-and-outdoors', 'bucket-list'],

  // ── ANZ + Pacific ───────────────────────────────────
  'australia': ['beaches-and-coast', 'diving-and-snorkeling', 'food-and-wine', 'adventure-and-outdoors', 'bucket-list', 'family-friendly', 'scenic-train-journeys', 'luxury'],
  'new-zealand': ['adventure-and-outdoors', 'hiking-and-trekking', 'scenic-train-journeys', 'food-and-wine', 'mountains-and-alpine', 'family-friendly', 'photography'],
  'cook-islands': ['beaches-and-coast', 'diving-and-snorkeling', 'cultural-immersion', 'honeymoon-and-romance', 'tropical-islands', 'off-the-beaten-path'],
  'fiji': ['beaches-and-coast', 'honeymoon-and-romance', 'diving-and-snorkeling', 'family-friendly', 'tropical-islands'],
  'french-polynesia': ['beaches-and-coast', 'diving-and-snorkeling', 'honeymoon-and-romance', 'luxury', 'tropical-islands', 'water-sports', 'whale-watching', 'cultural-immersion'],

  // ── Middle East ─────────────────────────────────────
  'israel': ['history-and-heritage', 'cultural-immersion', 'food-and-wine', 'desert-and-dunes'],
  'jordan': ['history-and-heritage', 'adventure-and-outdoors', 'hiking-and-trekking', 'cultural-immersion', 'family-friendly', 'desert-and-dunes'],
  'morocco': ['cultural-immersion', 'food-and-wine', 'hiking-and-trekking', 'history-and-heritage', 'desert-and-dunes', 'art-and-architecture', 'bucket-list', 'photography'],
  'turkey': ['history-and-heritage', 'food-and-wine', 'art-and-architecture', 'honeymoon-and-romance', 'cultural-immersion', 'off-the-beaten-path'],
  'oman': ['cultural-immersion', 'history-and-heritage', 'diving-and-snorkeling', 'family-friendly', 'desert-and-dunes', 'beaches-and-coast'],
  'uae': ['family-friendly', 'luxury', 'first-international-trip', 'beaches-and-coast', 'desert-and-dunes'],

  // ── WEMEA ───────────────────────────────────────────
  'iceland': ['adventure-and-outdoors', 'hiking-and-trekking', 'whale-watching', 'photography', 'family-friendly', 'off-the-beaten-path'],
  'ireland': ['history-and-heritage', 'food-and-wine', 'adventure-and-outdoors', 'first-international-trip', 'family-friendly'],
  'england': ['history-and-heritage', 'art-and-architecture', 'cultural-immersion', 'food-and-wine', 'first-international-trip'],
  'portugal': ['food-and-wine', 'beaches-and-coast', 'history-and-heritage', 'whale-watching', 'solo-traveler', 'hiking-and-trekking'],
  'azores': ['hiking-and-trekking', 'whale-watching', 'adventure-and-outdoors', 'off-the-beaten-path', 'photography'],
  'scotland': ['adventure-and-outdoors', 'hiking-and-trekking', 'history-and-heritage', 'scenic-train-journeys', 'mountains-and-alpine'],
  'spain': ['food-and-wine', 'art-and-architecture', 'history-and-heritage', 'beaches-and-coast', 'cultural-immersion'],
  'river-cruises': ['food-and-wine', 'relaxation-and-wellness', 'active-seniors', 'cultural-immersion', 'scenic-train-journeys'],
  'egypt': ['history-and-heritage', 'cultural-immersion', 'bucket-list', 'first-international-trip', 'diving-and-snorkeling', 'desert-and-dunes'],

  // ── Asia ────────────────────────────────────────────
  'bhutan': ['cultural-immersion', 'hiking-and-trekking', 'off-the-beaten-path', 'mountains-and-alpine', 'photography', 'adventure-and-outdoors', 'bucket-list', 'birding'],
  'cambodia': ['history-and-heritage', 'cultural-immersion', 'off-the-beaten-path', 'bucket-list', 'art-and-architecture', 'adventure-and-outdoors'],
  'china': ['history-and-heritage', 'cultural-immersion', 'food-and-wine', 'art-and-architecture', 'hiking-and-trekking', 'family-friendly'],
  'india': ['history-and-heritage', 'cultural-immersion', 'safari-and-wildlife', 'food-and-wine', 'art-and-architecture', 'luxury', 'scenic-train-journeys', 'mountains-and-alpine'],
  'indonesia': ['beaches-and-coast', 'diving-and-snorkeling', 'honeymoon-and-romance', 'tropical-islands', 'cultural-immersion', 'luxury', 'adventure-and-outdoors', 'family-friendly'],
  'japan': ['cultural-immersion', 'food-and-wine', 'scenic-train-journeys', 'art-and-architecture', 'hiking-and-trekking', 'family-friendly', 'mountains-and-alpine', 'bucket-list'],
  'laos': ['cultural-immersion', 'off-the-beaten-path', 'adventure-and-outdoors', 'history-and-heritage'],
  'malaysia': ['beaches-and-coast', 'food-and-wine', 'hiking-and-trekking', 'adventure-and-outdoors', 'relaxation-and-wellness', 'family-friendly', 'history-and-heritage'],
  'malaysian-borneo': ['safari-and-wildlife', 'diving-and-snorkeling', 'off-the-beaten-path', 'hiking-and-trekking', 'tropical-islands', 'adventure-and-outdoors', 'photography'],
  'maldives': ['beaches-and-coast', 'honeymoon-and-romance', 'tropical-islands', 'diving-and-snorkeling', 'relaxation-and-wellness', 'luxury', 'water-sports'],
  'nepal': ['hiking-and-trekking', 'mountains-and-alpine', 'cultural-immersion', 'safari-and-wildlife', 'adventure-and-outdoors', 'off-the-beaten-path'],
  'philippines': ['beaches-and-coast', 'diving-and-snorkeling', 'tropical-islands', 'honeymoon-and-romance', 'adventure-and-outdoors', 'off-the-beaten-path', 'family-friendly', 'water-sports'],
  'sri-lanka': ['safari-and-wildlife', 'beaches-and-coast', 'hiking-and-trekking', 'off-the-beaten-path', 'honeymoon-and-romance', 'family-friendly', 'cultural-immersion', 'adventure-and-outdoors'],
  'singapore': ['food-and-wine', 'cultural-immersion', 'luxury', 'art-and-architecture', 'scenic-train-journeys'],
  'south-korea': ['food-and-wine', 'cultural-immersion', 'history-and-heritage', 'solo-traveler', 'art-and-architecture', 'relaxation-and-wellness'],
  'the-stans': ['history-and-heritage', 'off-the-beaten-path', 'cultural-immersion', 'adventure-and-outdoors', 'hiking-and-trekking', 'desert-and-dunes', 'mountains-and-alpine'],
  'kyrgyzstan': ['adventure-and-outdoors', 'hiking-and-trekking', 'mountains-and-alpine', 'off-the-beaten-path', 'cultural-immersion', 'photography'],
  'uzbekistan': ['history-and-heritage', 'art-and-architecture', 'cultural-immersion', 'photography', 'off-the-beaten-path', 'food-and-wine', 'desert-and-dunes'],
  'thailand': ['beaches-and-coast', 'food-and-wine', 'cultural-immersion', 'honeymoon-and-romance', 'family-friendly', 'adventure-and-outdoors', 'first-international-trip', 'relaxation-and-wellness'],
  'vietnam': ['history-and-heritage', 'food-and-wine', 'cultural-immersion', 'hiking-and-trekking', 'beaches-and-coast', 'honeymoon-and-romance', 'adventure-and-outdoors', 'family-friendly'],

  // ── CANAL (Central America, North America, Latin America) ──
  'usa-alaska': ['safari-and-wildlife', 'adventure-and-outdoors', 'mountains-and-alpine', 'scenic-train-journeys', 'whale-watching', 'bucket-list', 'active-seniors', 'photography'],
  'usa-california': ['beaches-and-coast', 'food-and-wine', 'hiking-and-trekking', 'adventure-and-outdoors', 'honeymoon-and-romance', 'family-friendly', 'whale-watching'],
  'usa-hawaii': ['beaches-and-coast', 'tropical-islands', 'diving-and-snorkeling', 'honeymoon-and-romance', 'water-sports', 'whale-watching', 'hiking-and-trekking', 'cultural-immersion'],
  'usa-new-england': ['history-and-heritage', 'food-and-wine', 'hiking-and-trekking', 'whale-watching', 'photography', 'mountains-and-alpine', 'active-seniors'],
  'usa-national-parks': ['adventure-and-outdoors', 'hiking-and-trekking', 'safari-and-wildlife', 'desert-and-dunes', 'mountains-and-alpine', 'photography', 'family-friendly', 'bucket-list'],
  'antarctica': ['bucket-list', 'safari-and-wildlife', 'adventure-and-outdoors', 'whale-watching', 'birding', 'photography', 'luxury'],
  'arctic-svalbard': ['safari-and-wildlife', 'birding', 'bucket-list', 'adventure-and-outdoors', 'whale-watching', 'photography'],
  'argentina': ['food-and-wine', 'hiking-and-trekking', 'adventure-and-outdoors', 'whale-watching', 'mountains-and-alpine', 'cultural-immersion', 'active-seniors', 'photography'],
  'belize': ['diving-and-snorkeling', 'beaches-and-coast', 'adventure-and-outdoors', 'history-and-heritage', 'birding', 'honeymoon-and-romance', 'family-friendly', 'off-the-beaten-path'],
  'bolivia': ['adventure-and-outdoors', 'off-the-beaten-path', 'desert-and-dunes', 'history-and-heritage', 'cultural-immersion', 'mountains-and-alpine', 'safari-and-wildlife'],
  'brazil': ['beaches-and-coast', 'safari-and-wildlife', 'adventure-and-outdoors', 'cultural-immersion', 'bucket-list', 'photography', 'tropical-islands'],
  'canada-east': ['history-and-heritage', 'cultural-immersion', 'food-and-wine', 'whale-watching', 'family-friendly', 'active-seniors', 'scenic-train-journeys'],
  'canada-west': ['safari-and-wildlife', 'mountains-and-alpine', 'adventure-and-outdoors', 'scenic-train-journeys', 'hiking-and-trekking', 'family-friendly', 'whale-watching', 'bucket-list'],
  'colombia': ['adventure-and-outdoors', 'food-and-wine', 'art-and-architecture', 'mountains-and-alpine', 'off-the-beaten-path', 'safari-and-wildlife'],
  'costa-rica': ['safari-and-wildlife', 'adventure-and-outdoors', 'beaches-and-coast', 'birding', 'honeymoon-and-romance', 'family-friendly'],
  'ecuador': ['birding', 'safari-and-wildlife', 'adventure-and-outdoors', 'off-the-beaten-path', 'family-friendly', 'mountains-and-alpine', 'cultural-immersion'],
  'chile': ['hiking-and-trekking', 'mountains-and-alpine', 'food-and-wine', 'adventure-and-outdoors', 'desert-and-dunes', 'honeymoon-and-romance', 'photography', 'bucket-list'],
  'galapagos': ['safari-and-wildlife', 'bucket-list', 'diving-and-snorkeling', 'honeymoon-and-romance', 'adventure-and-outdoors', 'photography'],
  'guatemala': ['cultural-immersion', 'history-and-heritage', 'off-the-beaten-path', 'art-and-architecture', 'mountains-and-alpine'],
  'mexico': ['cultural-immersion', 'history-and-heritage', 'food-and-wine', 'beaches-and-coast', 'honeymoon-and-romance', 'family-friendly', 'first-international-trip'],
  'peru': ['history-and-heritage', 'hiking-and-trekking', 'cultural-immersion', 'mountains-and-alpine', 'food-and-wine', 'bucket-list', 'adventure-and-outdoors', 'scenic-train-journeys'],
  'panama': ['beaches-and-coast', 'diving-and-snorkeling', 'off-the-beaten-path', 'family-friendly', 'tropical-islands', 'history-and-heritage'],
  'uruguay': ['beaches-and-coast', 'off-the-beaten-path', 'food-and-wine', 'history-and-heritage', 'family-friendly'],

  // ── ESE (Europe / Southeast Europe) ─────────────────
  'austria': ['history-and-heritage', 'art-and-architecture', 'food-and-wine', 'mountains-and-alpine', 'cultural-immersion', 'scenic-train-journeys', 'family-friendly'],
  'belgium': ['history-and-heritage', 'art-and-architecture', 'food-and-wine'],
  'croatia': ['beaches-and-coast', 'history-and-heritage', 'food-and-wine', 'honeymoon-and-romance', 'family-friendly', 'off-the-beaten-path', 'adventure-and-outdoors', 'water-sports'],
  'czech-republic-prague': ['history-and-heritage', 'art-and-architecture', 'food-and-wine', 'scenic-train-journeys'],
  'denmark': ['history-and-heritage', 'art-and-architecture', 'food-and-wine', 'cultural-immersion'],
  'france': ['food-and-wine', 'honeymoon-and-romance', 'history-and-heritage', 'art-and-architecture', 'family-friendly', 'luxury'],
  'germany': ['history-and-heritage', 'art-and-architecture', 'food-and-wine', 'mountains-and-alpine', 'family-friendly', 'scenic-train-journeys'],
  'greece': ['beaches-and-coast', 'history-and-heritage', 'honeymoon-and-romance', 'family-friendly', 'food-and-wine', 'art-and-architecture', 'relaxation-and-wellness', 'photography'],
  'hungary-budapest': ['history-and-heritage', 'scenic-train-journeys', 'art-and-architecture', 'food-and-wine'],
  'italy': ['food-and-wine', 'history-and-heritage', 'art-and-architecture', 'honeymoon-and-romance', 'beaches-and-coast', 'family-friendly', 'first-international-trip', 'photography'],
  'sardinia': ['beaches-and-coast', 'cultural-immersion', 'off-the-beaten-path'],
  'luxembourg': ['history-and-heritage', 'art-and-architecture', 'food-and-wine', 'hiking-and-trekking'],
  'netherlands': ['history-and-heritage', 'art-and-architecture', 'cultural-immersion'],
  'norway': ['mountains-and-alpine', 'adventure-and-outdoors', 'history-and-heritage', 'food-and-wine', 'photography', 'birding'],
  'sweden': ['history-and-heritage', 'art-and-architecture', 'adventure-and-outdoors', 'cultural-immersion', 'relaxation-and-wellness'],
  'switzerland': ['mountains-and-alpine', 'scenic-train-journeys', 'hiking-and-trekking', 'adventure-and-outdoors', 'family-friendly', 'food-and-wine', 'relaxation-and-wellness', 'photography'],
  'orient-express-trains': ['scenic-train-journeys', 'luxury', 'honeymoon-and-romance', 'relaxation-and-wellness'],
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('=== DRY RUN (no changes will be written) ===\n');
  }

  const snap = await db.collection('destinations').get();
  console.log(`Found ${snap.size} destinations in Firestore\n`);

  let tagged = 0;
  let skipped = 0;
  let totalTags = 0;

  for (const doc of snap.docs) {
    const slug = doc.id;
    const name = (doc.data().name as string) || slug;
    const tags = TAG_ASSIGNMENTS[slug];

    if (!tags || tags.length === 0) {
      console.log(`  ${name} (${slug}): no curated tags — skipping`);
      skipped++;
      continue;
    }

    tagged++;
    totalTags += tags.length;
    console.log(`  ${name}: ${tags.join(', ')} (${tags.length})`);

    if (!dryRun) {
      await doc.ref.update({ tags });
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Destinations tagged: ${tagged}/${snap.size}`);
  console.log(`Destinations skipped: ${skipped}`);
  console.log(`Total tags assigned: ${totalTags}`);
  console.log(`Average tags per destination: ${(totalTags / tagged).toFixed(1)}`);
  if (dryRun) {
    console.log('\n(Dry run — no changes written. Remove --dry-run to apply.)');
  } else {
    console.log('\nDone! Tags written to Firestore.');
  }
}

main().catch(err => {
  console.error('Auto-tag failed:', err);
  process.exit(1);
});

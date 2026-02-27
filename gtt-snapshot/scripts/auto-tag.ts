/**
 * Auto-tag script: assigns tags to destinations based on keyword matching.
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

const MAX_TAGS_PER_DEST = 8;

// Keyword map: each keyword maps to one or more tag slugs
const KEYWORD_MAP: Record<string, string[]> = {
  // Trip Style
  'beach': ['beaches-and-coast'],
  'beaches': ['beaches-and-coast'],
  'coast': ['beaches-and-coast'],
  'coastal': ['beaches-and-coast'],
  'seaside': ['beaches-and-coast'],
  'ocean': ['beaches-and-coast'],
  'safari': ['safari-and-wildlife'],
  'wildlife': ['safari-and-wildlife'],
  'game drive': ['safari-and-wildlife'],
  'big five': ['safari-and-wildlife'],
  'gorilla': ['safari-and-wildlife'],
  'cultural': ['cultural-immersion'],
  'culture': ['cultural-immersion'],
  'local traditions': ['cultural-immersion'],
  'indigenous': ['cultural-immersion'],
  'tribal': ['cultural-immersion'],
  'history': ['history-and-heritage'],
  'historic': ['history-and-heritage'],
  'heritage': ['history-and-heritage'],
  'ruins': ['history-and-heritage'],
  'ancient': ['history-and-heritage'],
  'temple': ['history-and-heritage'],
  'temples': ['history-and-heritage'],
  'archaeological': ['history-and-heritage'],
  'art': ['art-and-architecture'],
  'architecture': ['art-and-architecture'],
  'museum': ['art-and-architecture'],
  'museums': ['art-and-architecture'],
  'gallery': ['art-and-architecture'],
  'food': ['food-and-wine'],
  'wine': ['food-and-wine'],
  'culinary': ['food-and-wine'],
  'gastronomy': ['food-and-wine'],
  'cuisine': ['food-and-wine'],
  'adventure': ['adventure-and-outdoors'],
  'outdoors': ['adventure-and-outdoors'],
  'outdoor': ['adventure-and-outdoors'],
  'adrenaline': ['adventure-and-outdoors'],
  'spa': ['relaxation-and-wellness'],
  'wellness': ['relaxation-and-wellness'],
  'relaxation': ['relaxation-and-wellness'],
  'retreat': ['relaxation-and-wellness'],
  'off the beaten path': ['off-the-beaten-path'],
  'remote': ['off-the-beaten-path'],
  'undiscovered': ['off-the-beaten-path'],
  'less-visited': ['off-the-beaten-path'],
  'untouched': ['off-the-beaten-path'],

  // Activities
  'hiking': ['hiking-and-trekking'],
  'trekking': ['hiking-and-trekking'],
  'trek': ['hiking-and-trekking'],
  'hike': ['hiking-and-trekking'],
  'walking': ['hiking-and-trekking'],
  'diving': ['diving-and-snorkeling'],
  'snorkeling': ['diving-and-snorkeling'],
  'snorkel': ['diving-and-snorkeling'],
  'scuba': ['diving-and-snorkeling'],
  'reef': ['diving-and-snorkeling'],
  'water sport': ['water-sports'],
  'kayak': ['water-sports'],
  'kayaking': ['water-sports'],
  'surfing': ['water-sports'],
  'rafting': ['water-sports'],
  'canoeing': ['water-sports'],
  'train': ['scenic-train-journeys'],
  'rail': ['scenic-train-journeys'],
  'railway': ['scenic-train-journeys'],
  'whale': ['whale-watching'],
  'whale watching': ['whale-watching'],
  'birding': ['birding'],
  'bird watching': ['birding'],
  'birdwatching': ['birding'],
  'bird-watching': ['birding'],
  'ornithology': ['birding'],
  'photography': ['photography'],
  'photo': ['photography'],

  // Traveler Profile
  'honeymoon': ['honeymoon-and-romance'],
  'romance': ['honeymoon-and-romance'],
  'romantic': ['honeymoon-and-romance'],
  'couples': ['honeymoon-and-romance'],
  'family': ['family-friendly'],
  'families': ['family-friendly'],
  'kid': ['family-friendly'],
  'kids': ['family-friendly'],
  'children': ['family-friendly'],
  'child-friendly': ['family-friendly'],
  'multigenerational': ['multigenerational'],
  'multi-generational': ['multigenerational'],
  'grandparent': ['multigenerational'],
  'solo': ['solo-traveler'],
  'solo traveler': ['solo-traveler'],
  'first time': ['first-international-trip'],
  'first-time': ['first-international-trip'],
  'first trip': ['first-international-trip'],
  'bucket list': ['bucket-list'],
  'once in a lifetime': ['bucket-list'],
  'once-in-a-lifetime': ['bucket-list'],
  'bucket-list': ['bucket-list'],
  'luxury': ['luxury'],
  'high-end': ['luxury'],
  'five star': ['luxury'],
  '5-star': ['luxury'],
  'premium': ['luxury'],
  'upscale': ['luxury'],
  'active senior': ['active-seniors'],
  'seniors': ['active-seniors'],
  'retiree': ['active-seniors'],
  'retirement': ['active-seniors'],

  // Landscape
  'mountain': ['mountains-and-alpine'],
  'mountains': ['mountains-and-alpine'],
  'alpine': ['mountains-and-alpine'],
  'highlands': ['mountains-and-alpine'],
  'desert': ['desert-and-dunes'],
  'dunes': ['desert-and-dunes'],
  'sahara': ['desert-and-dunes'],
  'tropical island': ['tropical-islands'],
  'island': ['tropical-islands'],
  'islands': ['tropical-islands'],
  'archipelago': ['tropical-islands'],
};

function matchTags(text: string): Set<string> {
  const matched = new Set<string>();
  const lower = text.toLowerCase();

  // Sort keywords by length descending so longer phrases match first
  const keywords = Object.keys(KEYWORD_MAP).sort((a, b) => b.length - a.length);

  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      for (const slug of KEYWORD_MAP[keyword]) {
        matched.add(slug);
      }
    }
  }

  return matched;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('=== DRY RUN (no changes will be written) ===\n');
  }

  const snap = await db.collection('destinations').get();
  console.log(`Found ${snap.size} destinations\n`);

  let tagged = 0;
  let totalTags = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const name = data.name as string;

    // Build searchable text from relevant fields
    const fields = [
      data.key_facts,
      data.client_types_good,
      data.client_types_okay,
      data.client_types_bad,
      data.general_notes_1,
      data.general_notes_2,
      data.accommodations,
      data.urgency,
      data.how_to_feature,
    ].filter(Boolean).join(' ');

    const matched = matchTags(fields);

    if (matched.size === 0) {
      console.log(`  ${name}: no tags matched`);
      continue;
    }

    const tags = Array.from(matched).slice(0, MAX_TAGS_PER_DEST);
    tagged++;
    totalTags += tags.length;

    console.log(`  ${name}: ${tags.join(', ')}`);

    if (!dryRun) {
      await doc.ref.update({ tags });
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Destinations tagged: ${tagged}/${snap.size}`);
  console.log(`Total tags assigned: ${totalTags}`);
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

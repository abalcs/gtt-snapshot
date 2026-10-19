import { getDb } from '../db/database';

const GERMANY_PRICING = {
  pricing_tiers: [
    {
      tier_label: "Self-Drive",
      price_per_week: "$4k-$6k",
      price_per_day: null,
      notes: "Highlights of Germany road trip, Rhine Valley, Black Forest, Bavaria. Lower end for shoulder/low season.",
      sort_order: 0,
    },
    {
      tier_label: "Private Driver / Guided",
      price_per_week: "$7k-$9k",
      price_per_day: null,
      notes: "Berlin & Bavaria, Northern Germany, curated city and cultural experiences with private guide.",
      sort_order: 1,
    },
    {
      tier_label: "Premium / River Cruise",
      price_per_week: "$9k-$12k",
      price_per_day: null,
      notes: "AMAWaterways luxury river cruises, castle stays, Oktoberfest private experiences. Peak season at upper end.",
      sort_order: 2,
    },
  ],
  pricing_footnotes: [
    { label: "Solo Traveler (private driver)", price: "$10k-$12k" },
    { label: "Family Road Trip (14 days)", price: "$9k pp" },
    { label: "River Cruise (12 days)", price: "$7k-$10k pp" },
  ],
  updated_at: new Date().toISOString(),
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDb();

  const slug = 'germany';
  const docRef = db.collection('destinations').doc(slug);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.error(`ERROR: ${slug} destination document does not exist in Firestore.`);
    process.exit(1);
  }

  const existing = doc.data()!;
  console.log(`Found ${slug} (name: ${existing.name}, region: ${existing.region_name})`);

  if (dryRun) {
    console.log(`\n[DRY RUN] Would update ${slug} pricing:`);
    console.log('  pricing_tiers:');
    for (const tier of GERMANY_PRICING.pricing_tiers) {
      console.log(`    ${tier.tier_label}: ${tier.price_per_week} — ${tier.notes}`);
    }
    console.log('  pricing_footnotes:');
    for (const fn of GERMANY_PRICING.pricing_footnotes) {
      console.log(`    ${fn.label}: ${fn.price}`);
    }
  } else {
    await docRef.update(GERMANY_PRICING);
    console.log(`  Updated pricing_tiers (${GERMANY_PRICING.pricing_tiers.length} tiers) and pricing_footnotes (${GERMANY_PRICING.pricing_footnotes.length} footnotes).`);
  }

  process.exit(0);
}

main();

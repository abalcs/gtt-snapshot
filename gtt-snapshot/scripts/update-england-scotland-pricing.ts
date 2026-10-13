import { getDb } from '../db/database';

const ENGLAND_PRICING = {
  pricing_tiers: [
    {
      tier_label: "Self-Drive (Countryside)",
      price_per_week: "$7k-$10k",
      price_per_day: null,
      notes: "Cotswolds, Bath, Cornwall, Lake District. Lower end for shoulder/low season, higher for peak.",
      sort_order: 0,
    },
    {
      tier_label: "Private Driver",
      price_per_week: "$9k-$12k",
      price_per_day: null,
      notes: "Curated experiences with private guide. Includes historic houses, garden tours, literary sites.",
      sort_order: 1,
    },
    {
      tier_label: "Premium / Comprehensive",
      price_per_week: "$12k-$16k",
      price_per_day: null,
      notes: "Extended Cornwall, castle stays, exclusive access experiences. Peak season at upper end.",
      sort_order: 2,
    },
  ],
  pricing_footnotes: [
    { label: "Solo Traveler", price: "$10k-$15k" },
    { label: "London City Only (7 days)", price: "$7k-$10k" },
  ],
  updated_at: new Date().toISOString(),
};

const SCOTLAND_PRICING = {
  pricing_tiers: [
    {
      tier_label: "Self-Drive (Highlands & Islands)",
      price_per_week: "$5k-$7k",
      price_per_day: null,
      notes: "Outer Hebrides, Skye, Highland road trips. Budget-friendly, more independent.",
      sort_order: 0,
    },
    {
      tier_label: "Private Driver / Guided",
      price_per_week: "$7k-$11k",
      price_per_day: null,
      notes: "Castle tours, scenic routes with private guide. Edinburgh + Highlands.",
      sort_order: 1,
    },
    {
      tier_label: "Deluxe Castle & Luxury",
      price_per_week: "$12k-$16k",
      price_per_day: null,
      notes: "5-star castle stays, exclusive whisky tours, private estate experiences.",
      sort_order: 2,
    },
  ],
  pricing_footnotes: [
    { label: "Solo Traveler", price: "$12k" },
    { label: "Royal Scotsman (8 days)", price: "$30k+" },
    { label: "Family (2 adults + 2 children)", price: "$5k-$7k pp" },
  ],
  updated_at: new Date().toISOString(),
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDb();

  for (const [slug, data] of [['england', ENGLAND_PRICING], ['scotland', SCOTLAND_PRICING]] as const) {
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
      for (const tier of data.pricing_tiers) {
        console.log(`    ${tier.tier_label}: ${tier.price_per_week} — ${tier.notes}`);
      }
      console.log('  pricing_footnotes:');
      for (const fn of data.pricing_footnotes) {
        console.log(`    ${fn.label}: ${fn.price}`);
      }
    } else {
      await docRef.update(data);
      console.log(`  Updated pricing_tiers (${data.pricing_tiers.length} tiers) and pricing_footnotes (${data.pricing_footnotes.length} footnotes).`);
    }
    console.log('');
  }

  process.exit(0);
}

main();

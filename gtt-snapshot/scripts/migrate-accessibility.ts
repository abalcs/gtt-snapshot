import { getDb } from '../db/database';

interface AccessibilityScores {
  terrain_difficulty: number | null;
  wheelchair_friendliness: number | null;
  walking_required: number | null;
  altitude_concern: number | null;
  mobility_notes: string | null;
}

// ── Tier 1: Hardcoded overrides for well-known destinations ──────────

const HARDCODED: Record<string, Partial<AccessibilityScores>> = {
  // Asia — high altitude / rugged
  'nepal': { terrain_difficulty: 5, wheelchair_friendliness: 1, walking_required: 5, altitude_concern: 5, mobility_notes: 'High-altitude trekking destination. Many experiences require multi-day walks at elevation.' },
  'bhutan': { terrain_difficulty: 4, wheelchair_friendliness: 1, walking_required: 4, altitude_concern: 4, mobility_notes: 'Mountainous terrain with steep monastery access. Altitude ranges 2,000-5,000m.' },
  'tibet': { terrain_difficulty: 4, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 5, mobility_notes: 'Extreme altitude (3,500m+). Limited infrastructure for mobility-impaired travelers.' },
  'mongolia': { terrain_difficulty: 4, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 2, mobility_notes: 'Remote, roadless steppe. Ger camps and horseback are primary transport.' },

  // Asia — moderate
  'japan': { terrain_difficulty: 2, wheelchair_friendliness: 4, walking_required: 3, altitude_concern: 1, mobility_notes: 'Excellent urban accessibility. Temples may have stairs. Bullet trains are wheelchair-friendly.' },
  'china': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 2, mobility_notes: 'Great Wall and temple sites require extensive walking/stairs. Cities improving accessibility.' },
  'india': { terrain_difficulty: 3, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 2, mobility_notes: 'Uneven streets, crowded markets, limited ramps. Northern hill stations at altitude.' },
  'sri-lanka': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 2, mobility_notes: 'Hill country tea plantations require walking. Coastal areas more accessible.' },
  'vietnam': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: 'Cities have busy traffic and narrow sidewalks. Halong Bay boats require climbing.' },
  'cambodia': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: 'Angkor Wat temples involve significant walking and some steep stairs.' },
  'thailand': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 2, altitude_concern: 1, mobility_notes: 'Bangkok has BTS accessibility. Beach resorts generally flat. Temple stairs common.' },
  'indonesia': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: 'Bali temples have stairs. Komodo requires boat transfers and hiking.' },
  'borneo': { terrain_difficulty: 3, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 1, mobility_notes: 'Jungle lodges and wildlife experiences involve uneven terrain and boat transfers.' },
  'myanmar': { terrain_difficulty: 3, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 1, mobility_notes: 'Temples require barefoot walking. Infrastructure limited outside Yangon.' },
  'laos': { terrain_difficulty: 3, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 1, mobility_notes: 'Mountainous terrain. Luang Prabang has temple stairs. Boat travel common.' },
  'malaysia': { terrain_difficulty: 2, wheelchair_friendliness: 3, walking_required: 2, altitude_concern: 1, mobility_notes: 'KL is relatively accessible. Borneo jungle lodges less so.' },
  'philippines': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: 'Island-hopping requires boat transfers. Rice terraces involve hiking.' },

  // South Asia
  'maldives': { terrain_difficulty: 1, wheelchair_friendliness: 4, walking_required: 1, altitude_concern: 1, mobility_notes: 'Flat resort islands. Many resorts have accessible rooms and buggies.' },

  // Middle East
  'jordan': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 4, altitude_concern: 1, mobility_notes: 'Petra requires extensive walking on uneven terrain. Wadi Rum involves 4x4 transfers.' },
  'oman': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 2, altitude_concern: 1, mobility_notes: 'Desert camps and wadis involve rough terrain. Muscat hotels are accessible.' },
  'egypt': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: 'Pyramids/temples involve sand and uneven surfaces. Nile cruises are comfortable.' },

  // Africa — safari
  'south-africa': { terrain_difficulty: 2, wheelchair_friendliness: 3, walking_required: 2, altitude_concern: 1, mobility_notes: 'Game vehicles require climbing. Cape Town is relatively accessible. Some lodges have accessible rooms.' },
  'botswana': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 2, altitude_concern: 1, mobility_notes: 'Safari vehicles and mokoro require climbing in/out. Remote bush camps.' },
  'kenya': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 2, altitude_concern: 2, mobility_notes: 'Safari vehicles require step-up. Nairobi at 1,700m. Some lodges at altitude.' },
  'tanzania': { terrain_difficulty: 3, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 3, mobility_notes: 'Kilimanjaro treks at extreme altitude. Safari camps are remote. Zanzibar more accessible.' },
  'rwanda': { terrain_difficulty: 4, wheelchair_friendliness: 1, walking_required: 4, altitude_concern: 3, mobility_notes: 'Gorilla trekking requires hiking through dense forest at altitude (2,500m+).' },
  'uganda': { terrain_difficulty: 4, wheelchair_friendliness: 1, walking_required: 4, altitude_concern: 3, mobility_notes: 'Gorilla and chimp trekking on steep forest trails. Limited infrastructure.' },
  'namibia': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 2, altitude_concern: 1, mobility_notes: 'Desert terrain. Dune climbing optional. Long driving distances between sites.' },
  'zimbabwe': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 2, altitude_concern: 1, mobility_notes: 'Victoria Falls walkways can be slippery. Safari vehicles standard.' },
  'zambia': { terrain_difficulty: 2, wheelchair_friendliness: 1, walking_required: 2, altitude_concern: 1, mobility_notes: 'Walking safaris are a specialty. Remote bush camps with basic facilities.' },
  'madagascar': { terrain_difficulty: 4, wheelchair_friendliness: 1, walking_required: 4, altitude_concern: 1, mobility_notes: 'Poor roads, remote parks with hiking trails. Very limited accessibility infrastructure.' },
  'mozambique': { terrain_difficulty: 2, wheelchair_friendliness: 1, walking_required: 2, altitude_concern: 1, mobility_notes: 'Beach destinations. Sand paths between lodges. Limited accessibility.' },
  'ethiopia': { terrain_difficulty: 3, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 3, mobility_notes: 'Lalibela rock churches involve climbing. Simien Mountains at high altitude.' },

  // Americas
  'peru': { terrain_difficulty: 4, wheelchair_friendliness: 1, walking_required: 4, altitude_concern: 5, mobility_notes: 'Cusco at 3,400m, Machu Picchu requires hiking. Severe altitude concern for many travelers.' },
  'ecuador': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 3, mobility_notes: 'Quito at 2,800m. Galapagos involves boat transfers and wet landings.' },
  'galapagos': { terrain_difficulty: 3, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 1, mobility_notes: 'Wet/dry landings from pangas. Uneven volcanic terrain. Boat-based itineraries.' },
  'colombia': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 3, mobility_notes: 'Bogota at 2,600m. Cobblestone streets in Cartagena. Coffee region is hilly.' },
  'costa-rica': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: 'Rainforest trails can be muddy. Zip-lining and rafting require mobility. Beach areas accessible.' },
  'brazil': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 2, altitude_concern: 1, mobility_notes: 'Cities have improving accessibility. Pantanal lodges are remote.' },
  'argentina': { terrain_difficulty: 2, wheelchair_friendliness: 3, walking_required: 2, altitude_concern: 2, mobility_notes: 'Buenos Aires is relatively accessible. Patagonia involves more walking. NW at altitude.' },
  'chile': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 3, mobility_notes: 'Atacama at altitude. Torres del Paine involves hiking. Santiago accessible.' },
  'bolivia': { terrain_difficulty: 4, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 5, mobility_notes: 'La Paz at 3,600m, Uyuni at 3,650m. Extreme altitude throughout. Very limited infrastructure.' },
  'mexico': { terrain_difficulty: 2, wheelchair_friendliness: 3, walking_required: 2, altitude_concern: 1, mobility_notes: 'Beach resorts are accessible. Ruins involve climbing. Mexico City at moderate altitude.' },
  'guatemala': { terrain_difficulty: 3, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 2, mobility_notes: 'Cobblestone streets in Antigua. Tikal involves forest walking. Limited infrastructure.' },
  'cuba': { terrain_difficulty: 2, wheelchair_friendliness: 1, walking_required: 2, altitude_concern: 1, mobility_notes: 'Colonial streets are uneven. Very limited accessibility infrastructure.' },

  // Europe
  'italy': { terrain_difficulty: 2, wheelchair_friendliness: 3, walking_required: 3, altitude_concern: 1, mobility_notes: 'Cobblestone streets common. Hill towns require walking. Venice has bridges with steps.' },
  'greece': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: 'Santorini has steep caldera paths. Archaeological sites on uneven ground.' },
  'portugal': { terrain_difficulty: 2, wheelchair_friendliness: 3, walking_required: 3, altitude_concern: 1, mobility_notes: 'Lisbon is hilly with cobblestones. Sintra involves palace stairs.' },
  'spain': { terrain_difficulty: 2, wheelchair_friendliness: 3, walking_required: 3, altitude_concern: 1, mobility_notes: 'Cities are generally accessible. Alhambra involves extensive walking.' },
  'croatia': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: 'Dubrovnik old town has stairs. Plitvice Lakes involves boardwalks and steps.' },
  'iceland': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: 'Volcanic terrain, unpaved roads. Glacier walks and hiking are core activities.' },
  'norway': { terrain_difficulty: 3, wheelchair_friendliness: 3, walking_required: 3, altitude_concern: 1, mobility_notes: 'Fjord region involves steep terrain. Good accessibility in cities.' },
  'scotland': { terrain_difficulty: 3, wheelchair_friendliness: 3, walking_required: 3, altitude_concern: 1, mobility_notes: 'Highland terrain is rugged. Castle visits involve stairs. Edinburgh has steep hills.' },
  'ireland': { terrain_difficulty: 2, wheelchair_friendliness: 3, walking_required: 2, altitude_concern: 1, mobility_notes: 'Generally gentle terrain. Some castle ruins have uneven surfaces.' },
  'turkey': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: 'Cappadocia has uneven terrain. Ephesus involves extensive walking. Istanbul hilly.' },

  // Oceania
  'australia': { terrain_difficulty: 2, wheelchair_friendliness: 4, walking_required: 2, altitude_concern: 1, mobility_notes: 'Good accessibility standards. Outback is remote. Reef boats require mobility.' },
  'new-zealand': { terrain_difficulty: 3, wheelchair_friendliness: 3, walking_required: 3, altitude_concern: 1, mobility_notes: 'Adventure activities require fitness. Great walks involve multi-day hiking. Cities accessible.' },
  'fiji': { terrain_difficulty: 1, wheelchair_friendliness: 3, walking_required: 1, altitude_concern: 1, mobility_notes: 'Flat resort islands. Boat transfers to outer islands.' },

  // Indian subcontinent
  'pakistan': { terrain_difficulty: 4, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 4, mobility_notes: 'Karakoram Highway at extreme altitude. Very limited infrastructure.' },

  // Central Asia
  'uzbekistan': { terrain_difficulty: 2, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 1, mobility_notes: 'Cities have uneven surfaces. Limited accessibility in historic sites.' },
};

// ── Tier 2: Keyword-based score adjustments ──────────────────────

const KEYWORD_ADJUSTMENTS: { pattern: RegExp; field: keyof AccessibilityScores; delta: number }[] = [
  { pattern: /wheelchair/i, field: 'wheelchair_friendliness', delta: -1 },
  { pattern: /cobblestone|cobbled/i, field: 'wheelchair_friendliness', delta: -1 },
  { pattern: /altitude|high.?elevation/i, field: 'altitude_concern', delta: 1 },
  { pattern: /trek|trekking|hiking|hike/i, field: 'walking_required', delta: 1 },
  { pattern: /rugged|steep|mountainous/i, field: 'terrain_difficulty', delta: 1 },
  { pattern: /stairs|steps|climb/i, field: 'walking_required', delta: 1 },
  { pattern: /flat|level|accessible/i, field: 'terrain_difficulty', delta: -1 },
  { pattern: /jungle|rainforest|forest trail/i, field: 'terrain_difficulty', delta: 1 },
  { pattern: /boat transfer|wet landing/i, field: 'wheelchair_friendliness', delta: -1 },
];

// ── Tier 3: Region-based defaults ────────────────────────────────

const REGION_DEFAULTS: Record<string, AccessibilityScores> = {
  'europe': { terrain_difficulty: 2, wheelchair_friendliness: 3, walking_required: 3, altitude_concern: 1, mobility_notes: null },
  'asia': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 2, mobility_notes: null },
  'africa': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 2, altitude_concern: 2, mobility_notes: null },
  'south-america': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 2, mobility_notes: null },
  'central-america': { terrain_difficulty: 3, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: null },
  'north-america': { terrain_difficulty: 2, wheelchair_friendliness: 4, walking_required: 2, altitude_concern: 1, mobility_notes: null },
  'middle-east': { terrain_difficulty: 2, wheelchair_friendliness: 2, walking_required: 3, altitude_concern: 1, mobility_notes: null },
  'oceania': { terrain_difficulty: 2, wheelchair_friendliness: 3, walking_required: 2, altitude_concern: 1, mobility_notes: null },
  'indian-subcontinent': { terrain_difficulty: 3, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 2, mobility_notes: null },
  'central-asia': { terrain_difficulty: 3, wheelchair_friendliness: 1, walking_required: 3, altitude_concern: 2, mobility_notes: null },
  'caribbean': { terrain_difficulty: 1, wheelchair_friendliness: 3, walking_required: 1, altitude_concern: 1, mobility_notes: null },
};

// Global fallback
const FALLBACK: AccessibilityScores = {
  terrain_difficulty: 3,
  wheelchair_friendliness: 2,
  walking_required: 3,
  altitude_concern: 1,
  mobility_notes: null,
};

function clamp(val: number): number {
  return Math.max(1, Math.min(5, val));
}

function computeScores(slug: string, regionSlug: string, textFields: string[]): AccessibilityScores {
  // Tier 1: hardcoded
  const hardcoded = HARDCODED[slug];
  if (hardcoded) {
    return {
      terrain_difficulty: hardcoded.terrain_difficulty ?? null,
      wheelchair_friendliness: hardcoded.wheelchair_friendliness ?? null,
      walking_required: hardcoded.walking_required ?? null,
      altitude_concern: hardcoded.altitude_concern ?? null,
      mobility_notes: hardcoded.mobility_notes ?? null,
    };
  }

  // Start from region defaults or global fallback
  const regionDefaults = REGION_DEFAULTS[regionSlug] ?? FALLBACK;
  const scores: AccessibilityScores = { ...regionDefaults };

  // Tier 2: keyword adjustments from text content
  const allText = textFields.join(' ');
  for (const adj of KEYWORD_ADJUSTMENTS) {
    if (adj.pattern.test(allText)) {
      const field = adj.field as 'terrain_difficulty' | 'wheelchair_friendliness' | 'walking_required' | 'altitude_concern';
      const current = scores[field];
      if (current !== null) {
        scores[field] = clamp(current + adj.delta);
      }
    }
  }

  return scores;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDb();
  const snap = await db.collection('destinations').get();

  let migrated = 0;
  let skipped = 0;

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Processing ${snap.size} destinations...\n`);

  for (const doc of snap.docs) {
    const data = doc.data();
    const name = data.name as string;
    const slug = doc.id;
    const regionSlug = (data.region_slug as string) || '';

    // Skip if already has scores
    if (data.terrain_difficulty != null || data.wheelchair_friendliness != null) {
      console.log(`  SKIP  ${name} (already has scores)`);
      skipped++;
      continue;
    }

    const textFields = [
      data.client_types_good,
      data.client_types_okay,
      data.client_types_bad,
      data.key_facts,
      data.general_notes_1,
      data.general_notes_2,
    ].filter(Boolean) as string[];

    const scores = computeScores(slug, regionSlug, textFields);

    const source = HARDCODED[slug] ? 'hardcoded' : 'inferred';
    console.log(
      `  ${name}: terrain=${scores.terrain_difficulty} wheelchair=${scores.wheelchair_friendliness} ` +
      `walking=${scores.walking_required} altitude=${scores.altitude_concern} [${source}]`
    );
    if (scores.mobility_notes) {
      console.log(`    notes: ${scores.mobility_notes}`);
    }

    if (!dryRun) {
      await doc.ref.update({
        terrain_difficulty: scores.terrain_difficulty ?? null,
        wheelchair_friendliness: scores.wheelchair_friendliness ?? null,
        walking_required: scores.walking_required ?? null,
        altitude_concern: scores.altitude_concern ?? null,
        mobility_notes: scores.mobility_notes ?? null,
      });
    }
    migrated++;
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Migrated: ${migrated}, Skipped: ${skipped}`);
  process.exit(0);
}

main();

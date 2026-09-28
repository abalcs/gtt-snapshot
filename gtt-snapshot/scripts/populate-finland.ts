import { getDb } from '../db/database';

const FINLAND_DATA = {
  key_facts: "Capital: Helsinki. Population: 5.6 million with roughly 3 million saunas. Known as the Land of a Thousand Lakes (actually 188,000 lakes). Helsinki: Design District, Suomenlinna UNESCO fortress, Market Square, Helsinki Cathedral, Kamppi Chapel of Silence. Lapland: Northern Lights viewing, Santa Claus Village in Rovaniemi, husky sledding, reindeer encounters. Lakes Region (Lakeland): Europe's largest lake district centered on Savonlinna and Kuopio. Midnight sun from May to July north of the Arctic Circle; polar nights in winter. Sauna culture is a UNESCO Intangible Cultural Heritage element.",
  talking_points: "Northern Lights without the crowds -- Finnish Lapland has lower tourist density than Iceland or Norway with equally reliable aurora viewing from September through March.\nGlass igloo accommodations are a signature Finland experience that no other destination replicates at this scale -- clients can watch the aurora from bed.\nYear-round destination with two distinct peak seasons: summer midnight sun for lakes and hiking, winter for snow activities and aurora.\nSauna culture goes far beyond a spa amenity -- it is central to Finnish daily life. Clients get authentic cultural immersion simply by participating.\nExcellent safety record: consistently ranked among the world's safest countries with virtually no petty crime or tourist-targeted scams.\nDesign and architecture are world-class -- Helsinki's Design District, Alvar Aalto buildings, and Marimekko and Iittala flagship stores appeal to design-minded travelers.",
  accommodations: "Glass Igloos (Kakslauttanen, Arctic Fox Igloos, Apukka Resort -- book 6-12 months ahead for peak aurora season). Arctic Lodges and Wilderness Hotels (Wilderness Hotel Nellim, Arctic TreeHouse Hotel, Octola Private Wilderness). Design Hotels in Helsinki (Hotel St. George, Hotel Kamp, Clarion Hotel Helsinki). Lakeside Cabins and Villas (traditional mökki cottages throughout Lakeland, modern luxury villas on Lake Saimaa). Snow Hotels and Ice Rooms (rebuilt annually from snow and ice, seasonal December-April). Boutique Countryside Hotels (manor houses and renovated estates in southern Finland).",
  how_to_feature: "Position as a dual-season bucket-list destination: winter for Northern Lights and glass igloos, summer for midnight sun and lake country. Pair with other Nordic capitals for a broader Scandinavian itinerary or sell standalone for 7-10 nights combining Helsinki with Lapland or Lakeland.",
  pair_with: "Norway, Sweden, Denmark, Estonia, Iceland",
  general_notes_1: "Getting there: Direct flights from JFK, LAX, and DFW to Helsinki (9-10 hours). Finnair is the primary carrier. Helsinki serves as a convenient hub for connections to all of Northern Europe and is a common stopover on routes to Asia. Getting around: Domestic flights from Helsinki to Rovaniemi (Lapland) take 1.5 hours. VR trains connect Helsinki to major cities. Self-drive is straightforward in summer; winter driving requires experience with icy conditions. Currency: Euro (EUR). Contactless and card payments accepted virtually everywhere, including market stalls. Tipping: Not expected. Service charges are included. Rounding up or leaving small change is appreciated but never required. Language: Finnish and Swedish are official languages. English is widely spoken, especially in cities and tourist areas. Finland consistently ranks among the top countries globally for English proficiency.",
  general_notes_2: "Safety: One of the safest countries in the world. Violent crime is extremely rare and petty theft is uncommon. Primary safety considerations are environmental: extreme cold in Lapland winter (-20 to -30C), winter driving conditions, and brief daylight hours November-January. Cultural tips: Finns value personal space and quiet -- do not mistake reserve for unfriendliness. Sauna etiquette varies by setting but nudity is standard in private saunas. Remove shoes when entering homes. Weather expectations: Summer (June-August) 15-25C/60-77F with up to 24 hours daylight in the north. Winter (December-February) -5 to -30C/23 to -22F in Lapland with as little as 2-3 hours daylight. Helsinki winters are milder (-5 to -15C). Unique experiences: Ice swimming (avanto), berry and mushroom foraging in late summer, ice fishing, smoke sauna sessions, icebreaker cruises in the Gulf of Bothnia.",
  client_types_good: "Nature and outdoor enthusiasts, Northern Lights seekers, Adventure travelers (husky sledding, snowmobiling, skiing), Design and architecture lovers, Bucket-list travelers, Couples seeking unique romantic experiences (glass igloos), Families with kids 6+ (Santa Claus Village, snow activities)",
  client_types_okay: "Active seniors (good infrastructure but winter conditions can be challenging), First-time international travelers (very safe and English-friendly but remote), Food and wine enthusiasts (emerging culinary scene in Helsinki but not a primary food destination)",
  client_types_bad: "Beach and resort seekers, Warm-weather-only travelers, Clients wanting vibrant nightlife and party scenes, Budget travelers (Finland is expensive), Clients with significant mobility limitations seeking Lapland winter experiences, Clients uncomfortable with cold or darkness",
  night_min: 7,
  solo_pricing: "$8k-$14k",
  seasonality: JSON.stringify([
    { level: "Peak", date_range: "June-August", description: "Summer: midnight sun, 15-25C, hiking, lakes, festivals. Longest days. Best for Lakeland and Helsinki." },
    { level: "Peak", date_range: "December-March", description: "Winter: Northern Lights, snow activities, glass igloos, Santa Claus Village. Best for Lapland." },
    { level: "Shoulder", date_range: "April-May, September-October", description: "Spring has snow melt and lengthening days. Autumn (ruska) has spectacular fall foliage in Lapland and Northern Lights begin. 25-45% savings on accommodation." },
    { level: "Low", date_range: "Late October-November", description: "Transition period: snow has not yet arrived in Lapland, short dark days, many outdoor operators closed. Lowest prices." },
  ]),
  pricing_tiers: [
    { tier_label: "Shoulder / Value", price_per_week: "$5k-$8k", price_per_day: null, notes: "Spring or autumn. Fewer crowds, lower hotel rates. Northern Lights possible Sept-Oct.", sort_order: 0 },
    { tier_label: "Summer (Helsinki + Lakeland)", price_per_week: "$7k-$10k", price_per_day: null, notes: "Self-guided or with private guide. Helsinki design hotels + lakeside villa.", sort_order: 1 },
    { tier_label: "Winter Lapland (Glass Igloo)", price_per_week: "$10k-$18k", price_per_day: null, notes: "Glass igloo stays, husky/reindeer safaris, Northern Lights excursions. Premium properties book out 6-12 months ahead.", sort_order: 2 },
    { tier_label: "Luxury / Opulent", price_per_week: "$15k-$25k", price_per_day: null, notes: "Octola Private Wilderness or equivalent. Private guides, helicopter transfers, exclusive experiences.", sort_order: 3 },
  ],
  tags: [
    "adventure-and-outdoors",
    "cultural-immersion",
    "off-the-beaten-path",
    "relaxation-and-wellness",
    "hiking-and-trekking",
    "photography",
    "self-drive",
    "honeymoon-and-romance",
    "family-friendly",
    "bucket-list",
    "luxury",
  ],
  best_seasons: ["winter", "summer"],
  budget_tiers: ["mid-range", "premium"],
  terrain_difficulty: 3,
  wheelchair_friendliness: 3,
  walking_required: 3,
  altitude_concern: 1,
  mobility_notes: "Helsinki is well-accessible with heated walkways, low-floor transit, and ramps throughout the city. Wheelchair users can navigate Helsinki comfortably. Suomenlinna fortress has uneven terrain. Lapland presents significant challenges in winter: snow and ice make outdoor wheelchair use very difficult, and many traditional log cabins have steps and narrow doors. Modern hotels in Rovaniemi and Levi have accessible rooms and adapted transport. Summer terrain in national parks varies from boardwalk trails (accessible) to rugged backcountry (not accessible). Finland is essentially flat with no altitude concerns.",
  urgency: null,
  pax_limit: null,
  accommodation_url: null,
  pricing_footnotes: null,
  updated_at: new Date().toISOString(),
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDb();

  const docRef = db.collection('destinations').doc('finland');
  const doc = await docRef.get();

  if (!doc.exists) {
    console.error('ERROR: Finland destination document does not exist in Firestore.');
    console.error('Create the destination via the admin UI first, then run this script.');
    process.exit(1);
  }

  const existing = doc.data()!;
  console.log(`Found Finland destination (name: ${existing.name}, region: ${existing.region_name})`);

  if (dryRun) {
    console.log('\n[DRY RUN] Would update the following fields:');
    for (const [key, value] of Object.entries(FINLAND_DATA)) {
      const preview = typeof value === 'string'
        ? value.substring(0, 80) + (value.length > 80 ? '...' : '')
        : JSON.stringify(value).substring(0, 80);
      console.log(`  ${key}: ${preview}`);
    }
  } else {
    await docRef.update(FINLAND_DATA);
    console.log('\nFinland destination updated successfully with all content fields.');
  }

  process.exit(0);
}

main();

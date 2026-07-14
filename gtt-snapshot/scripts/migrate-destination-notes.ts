import { getDb } from '../db/database';

interface NoteUpdate {
  slug: string;
  field: 'general_notes_1' | 'general_notes_2';
  mode: 'set' | 'append';
  text: string;
}

const updates: NoteUpdate[] = [
  // --- Japan: Mt. Fuji climbing window ---
  {
    slug: 'japan',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Mt. Fuji: The window for climbing is very small — early July to early September only (about 2 months). We can help with it but only during those months. Outside of that time it is dangerous.',
  },

  // --- UAE: Dubai stopover ---
  {
    slug: 'uae',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Dubai: We have 3 Country Specialists trained for Dubai. Stop sell as a solo destination, but we can organize it as a 2-3 day stopover.',
  },

  // --- Indonesia: LGBTQ+ note ---
  {
    slug: 'indonesia',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Indonesia is a Muslim country — best not to broadcast LGBTQ+ relationships.',
  },

  // --- Vietnam: enrich war vet note ---
  {
    slug: 'vietnam',
    field: 'general_notes_2',
    mode: 'append',
    text: 'For vets, we also discuss how the country has changed and can build a cultural trip with added focus on the places they served during the war.',
  },

  // --- South Africa: routing advice ---
  {
    slug: 'south-africa',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Routing tip: Clients wanting South Africa + Botswana + Tanzania should know that a lot of their time will be wasted by overnight hotel stays for connections. If willing, suggest subbing Tanzania for Kenya — the routing will be smoother.',
  },

  // --- Botswana: routing advice ---
  {
    slug: 'botswana',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Routing tip: Clients combining Botswana + South Africa + Tanzania lose a lot of time to overnight connection stays. If flexible, suggest Kenya instead of Tanzania for a smoother itinerary.',
  },

  // --- Tanzania: routing advice ---
  {
    slug: 'tanzania',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Routing tip: Clients wanting South Africa + Botswana + Tanzania should know connections waste a lot of time with overnight hotel stays. If willing, suggest Kenya instead of Tanzania — the routing is much smoother.',
  },

  // --- Egypt: regions we cover ---
  {
    slug: 'egypt',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Areas we cover: Hurghada, Luxor, Aswan, Cairo, Alexandria. Popular areas we either no longer service or don\'t have fortified relations: Siwa, Sinai Peninsula, Sharm El Sheikh, Marsa Alam.',
  },

  // --- River Cruises: all AmaWaterways itineraries + countries ---
  {
    slug: 'river-cruises',
    field: 'general_notes_1',
    mode: 'append',
    text: `We offer any of AmaWaterways' European options. Netherlands, Germany, Austria, Hungary, France, and Portugal are the main countries. Their itineraries hit a few others, but those are the countries we sell land options for as well.

AmaWaterways Itineraries:
• "Tulip Time" Amsterdam — 7N Roundtrip: Amsterdam, Hoorn, Delta, Middelburg, Ghent, Antwerp, Rotterdam, Kinderdijk, Amsterdam
• "Enticing Douro" — 7N Porto Roundtrip: Porto, Regua, Pinhao, Vega de Terron, Barca d'Alva, Pinhao, Entre-os-Rios, Porto
• "Colors of Provence" — 7N Lyon to Vivieres: Lyon, Villefranche-sur-Saone, Vienne, Tournon, Tarascon, Avignon, Vivieres
• "Taste of Bordeaux" — 7N Bordeaux Roundtrip: Bordeaux, Libourne, Blaye, Bourg, Pauillac, Cadillac, Bordeaux
• "Magna on the Danube" — 7N Budapest to Vilshofen: Budapest, Vienna, Bratislava, Vienna, Krems, Spitz, Linz, Passau, Grein, Vilshofen
• "Romantic Danube" — 7N Budapest to Vilshofen: Budapest, Bratislava, Vienna, Weissenkirchen, Linz, Passau, Vilshofen
• "Captivating Rhine" — 7N Amsterdam to Basel: Amsterdam, Cologne, Rudesheim, Ludwigshafen, Strasbourg, Breisach, Basel

You can send clients to the AmaWaterways itinerary online if you want. AmaWaterways prefers not to book with clients directly, so they make it pretty difficult. You can download a PDF and send it. When the client is ready, we can quote them an itinerary based on dates, cost, and cabin.`,
  },

  // --- Ireland: coverage + private driver ---
  {
    slug: 'ireland',
    field: 'general_notes_1',
    mode: 'set',
    text: `We pretty much cover the entire island, but can't always promise a lot of excursions and hotels in the "Ancient East" as it's sometimes called. There's an area south/southeast of Dublin that's mostly small villages and less touristy which we don't cover, but sometimes clients with Irish heritage will ask about it.

Private driver is better for large groups — we have a 16-seater van available.`,
  },

  // --- France: coverage gaps ---
  {
    slug: 'france',
    field: 'general_notes_1',
    mode: 'set',
    text: 'We do not have product in the cities of Marseille, Cannes, or Menton. We do not offer self-drive in the French Riviera.',
  },

  // --- England: coverage areas ---
  {
    slug: 'england',
    field: 'general_notes_2',
    mode: 'set',
    text: `No accommodations in Cornwall. What we cover in England: London and day trips to the surrounding area (Canterbury, Dover, Brighton, Bath); Bath and The Cotswolds (most of the English countryside immediately to the west of London); Lake District (northern England, near Scotland).`,
  },

  // --- Scotland: coverage gaps ---
  {
    slug: 'scotland',
    field: 'general_notes_1',
    mode: 'append',
    text: `We cover a lot of Scotland — easier to list what we don't cover: North Coast 500 (NC 500), a stretch of very remote highland areas in the northwest; Inner and Outer Hebrides islands.`,
  },

  // --- Portugal: limited coverage context ---
  {
    slug: 'portugal',
    field: 'general_notes_2',
    mode: 'append',
    text: 'We do not have off-the-beaten-path product in Portugal. We basically have the Algarve, Lisbon area, Porto, and Douro Valley. We have hotels in a few other places but zero excursions. We launched Portugal at Audley within the last 4 years and are working on expanding carefully for the best possible experience.',
  },

  // --- Chile: typical routing + Ushuaia (Patagonia comparison already on page) ---
  {
    slug: 'chile',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Typical Patagonia routing: Santiago → Torres Del Paine (3 days) → Perito Moreno (1 day) → Buenos Aires. We can send clients to Ushuaia as an add-on — it offers pretty places, but it is primarily a port city for Antarctic boats. Getting there adds two domestic flights and usually isn\'t worth clients\' time or money.',
  },

  // --- Argentina: Patagonia character + routing ---
  {
    slug: 'argentina',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Argentine Patagonia is focused on glacier trekking, particularly Perito Moreno Glacier. Has small towns but not enough to keep clients interested for days. More appealing for the independent, adventurous hiker. Really difficult to connect Argentine and Chilean Patagonia by flights — clients can drive but it\'s 5 hours. Typical routing: Santiago → Torres Del Paine (3 days) → Perito Moreno (1 day) → Buenos Aires.',
  },

  // --- Peru: Nazca Lines warning ---
  {
    slug: 'peru',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Nazca Lines: We can send clients, however they MUST book their own domestic flight there. There have been many plane crashes, which is why we do not arrange the flight.',
  },

  // --- USA general rules: add to all 4 US pages + Alaska ---
  // USA - California
  {
    slug: 'usa-california',
    field: 'general_notes_2',
    mode: 'set',
    text: 'USA general rule: Must have at least 2 excursions and 5 nights accommodation, or 1 excursion and a car hire. Must be able to have a place for Audley to add value. Can\'t do: Route 66, South (SC), Great Lakes, skiing.',
  },
  // USA - National Parks
  {
    slug: 'usa-national-parks',
    field: 'general_notes_2',
    mode: 'append',
    text: 'USA general rule: Must have at least 2 excursions and 5 nights accommodation, or 1 excursion and a car hire. Must be able to have a place for Audley to add value. Can\'t do: Route 66, South (SC), Great Lakes, skiing.',
  },
  // USA - New England
  {
    slug: 'usa-new-england',
    field: 'general_notes_2',
    mode: 'append',
    text: 'USA general rule: Must have at least 2 excursions and 5 nights accommodation, or 1 excursion and a car hire. Hotels are not cheap — "even Travelodges will run at $200 min a night and we don\'t work with them."',
  },
  // USA - Hawaii
  {
    slug: 'usa-hawaii',
    field: 'general_notes_2',
    mode: 'append',
    text: 'USA general rule: Must have at least 2 excursions and 5 nights accommodation, or 1 excursion and a car hire. Must be able to have a place for Audley to add value.',
  },
  // USA - Alaska
  {
    slug: 'usa-alaska',
    field: 'general_notes_2',
    mode: 'append',
    text: 'USA general rule: Must have at least 2 excursions and 5 nights accommodation, or 1 excursion and a car hire. Must be able to have a place for Audley to add value.',
  },

  // --- Canada: can't sell to Canadians + Niagara Falls + questions ---
  // Canada East (Niagara is east)
  {
    slug: 'canada-east',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Reminder: We CANNOT sell Canada to Canadians. Niagara Falls: Cannot do a trip just for the falls — not enough to do there. We can send people to the quaint town of Niagara-on-the-Lake and do a day trip to the falls. Good discovery questions: Do you want self-drive? Cities? Bears?',
  },
  // Canada West
  {
    slug: 'canada-west',
    field: 'general_notes_2',
    mode: 'append',
    text: 'Reminder: We CANNOT sell Canada to Canadians. Good discovery questions to ask: Do you want self-drive? Cities? Bears?',
  },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDb();

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Processing ${updates.length} updates...\n`);

  let applied = 0;
  let skipped = 0;

  for (const u of updates) {
    const doc = await db.collection('destinations').doc(u.slug).get();
    if (!doc.exists) {
      console.log(`  SKIP  ${u.slug} — not found`);
      skipped++;
      continue;
    }

    const data = doc.data()!;
    const existing = (data[u.field] as string | null) ?? '';

    let newValue: string;
    if (u.mode === 'set' && !existing) {
      newValue = u.text;
    } else if (u.mode === 'set' && existing) {
      // Append even in set mode if field already has content
      newValue = existing + '\n\n' + u.text;
    } else {
      // append
      newValue = existing ? existing + '\n\n' + u.text : u.text;
    }

    console.log(`  ${data.name} [${u.field}] — ${u.mode === 'set' ? 'SET' : 'APPEND'}`);
    console.log(`    + ${u.text.substring(0, 80)}${u.text.length > 80 ? '...' : ''}`);

    if (!dryRun) {
      await doc.ref.update({ [u.field]: newValue });
    }
    applied++;
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Applied: ${applied}, Skipped: ${skipped}`);
  process.exit(0);
}

main();

/**
 * Batch update: fill missing pricing tiers + populate client_types for all destinations.
 *
 * Pricing sourced from Audley Travel website (audleytravel.com) trip pages,
 * converted to per-person-per-week ranges to match existing format.
 *
 * Client types written from an advisor perspective:
 *   good  = ideal match, proactively recommend
 *   okay  = workable with the right expectations
 *   bad   = steer elsewhere
 *
 * Run:
 *   GOOGLE_APPLICATION_CREDENTIALS=<path> node scripts/update-pricing-and-client-types.js
 */

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) initializeApp();
const db = getFirestore();

// ── Pricing updates (only destinations currently missing prices) ─────────

const pricingUpdates = {
  'arctic-svalbard': {
    pricing_tiers: [
      { tier_label: 'Peak', price_per_week: '$10k-$14k', notes: 'Summer expedition cruises (Jun-Aug), polar bear viewing, midnight sun', sort_order: 0 },
      { tier_label: 'Shoulder', price_per_week: '$8k-$10k', notes: 'Late spring/early fall sailings, northern lights season', sort_order: 1 },
      { tier_label: 'Low', price_per_week: null, notes: 'Very limited departures outside main seasons', sort_order: 2 },
    ],
  },
  'austria': {
    pricing_tiers: [
      { tier_label: 'Peak', price_per_week: '$8k-$10k', notes: 'Summer (Jul-Aug) and Christmas markets season', sort_order: 0 },
      { tier_label: 'Shoulder', price_per_week: '$6k-$8k', notes: 'Spring and early fall', sort_order: 1 },
      { tier_label: 'Low', price_per_week: '$5k-$6k', notes: 'Nov and late winter (excluding Christmas/New Year)', sort_order: 2 },
    ],
  },
  'cuba': {
    pricing_tiers: [
      { tier_label: 'Peak', price_per_week: '$5k-$6k', notes: 'Dec-Apr dry season', sort_order: 0 },
      { tier_label: 'Shoulder', price_per_week: '$4k-$5k', notes: 'Nov, May', sort_order: 1 },
      { tier_label: 'Low', price_per_week: '$3k-$4k', notes: 'Jun-Oct wet season', sort_order: 2 },
    ],
  },
  'honduras': {
    pricing_tiers: [
      { tier_label: 'Peak', price_per_week: '$5k-$6k', notes: 'Dec-Apr dry season, Bay Islands diving', sort_order: 0 },
      { tier_label: 'Shoulder', price_per_week: '$3.5k-$4.5k', notes: 'Nov, May', sort_order: 1 },
      { tier_label: 'Low', price_per_week: '$3k-$3.5k', notes: 'Jun-Oct', sort_order: 2 },
    ],
  },
  'paraguay': {
    pricing_tiers: [
      { tier_label: 'Peak', price_per_week: '$3k-$4k', notes: 'Jun-Sep dry season', sort_order: 0 },
      { tier_label: 'Shoulder', price_per_week: '$2.5k-$3k', notes: 'Apr-May, Oct', sort_order: 1 },
      { tier_label: 'Low', price_per_week: '$2k-$2.5k', notes: 'Nov-Mar wet/hot season', sort_order: 2 },
    ],
  },
  'philippines': {
    pricing_tiers: [
      { tier_label: 'Peak', price_per_week: '$4k-$5k', notes: 'Dec-May dry season, island hopping', sort_order: 0 },
      { tier_label: 'Shoulder', price_per_week: '$3k-$4k', notes: 'Jun, Nov', sort_order: 1 },
      { tier_label: 'Low', price_per_week: '$2.5k-$3k', notes: 'Jul-Oct typhoon season', sort_order: 2 },
    ],
  },
  'sardinia': {
    pricing_tiers: [
      { tier_label: 'Peak', price_per_week: '$8k-$10k', notes: 'Jul-Aug, coastal self-drive with boutique hotels', sort_order: 0 },
      { tier_label: 'Shoulder', price_per_week: '$6k-$8k', notes: 'May-Jun, Sep-Oct', sort_order: 1 },
      { tier_label: 'Low', price_per_week: '$4k-$5k', notes: 'Off-season, limited availability', sort_order: 2 },
    ],
  },
  'the-stans': {
    pricing_tiers: [
      { tier_label: 'Peak', price_per_week: '$5k-$7k', notes: 'Spring (Apr-Jun) and fall (Sep-Oct) along the Silk Road', sort_order: 0 },
      { tier_label: 'Shoulder', price_per_week: '$4k-$5k', notes: 'Jul-Aug (hot but possible for mountain regions)', sort_order: 1 },
      { tier_label: 'Low', price_per_week: '$3k-$4k', notes: 'Nov-Mar, cold but fewer crowds', sort_order: 2 },
    ],
  },
  'tibet': {
    pricing_tiers: [
      { tier_label: 'Peak', price_per_week: '$5k-$7k', notes: 'May-Oct, trekking and festival season', sort_order: 0 },
      { tier_label: 'Shoulder', price_per_week: '$4k-$5k', notes: 'Apr, Nov', sort_order: 1 },
      { tier_label: 'Low', price_per_week: '$3k-$4k', notes: 'Dec-Mar, cold but clear skies', sort_order: 2 },
    ],
  },
};

// ── Client type updates (all destinations) ──────────────────────────────

const clientTypeUpdates = {
  'antarctica': {
    client_types_good: 'Bucket-list travelers, Wildlife & photography enthusiasts, Luxury adventure seekers, Active retirees, Celebration trips (milestone birthdays/anniversaries)',
    client_types_okay: 'Multigenerational groups with fit seniors, Couples seeking a unique honeymoon',
    client_types_bad: 'Budget-conscious travelers, Families with young children, Anyone prone to seasickness, Travelers wanting warm-weather beach holidays',
  },
  'arctic-svalbard': {
    client_types_good: 'Wildlife & photography enthusiasts (polar bears), Expedition cruise lovers, Bucket-list adventurers, Nature-focused travelers',
    client_types_okay: 'Active retirees with good mobility, Couples seeking something unique',
    client_types_bad: 'Budget-conscious travelers, Families with young children, Beach/resort seekers, Those with mobility limitations',
  },
  'argentina': {
    client_types_good: 'Food & wine lovers, Active adventurers (Patagonia trekking), Honeymoon couples, Photography enthusiasts, Self-drive road trippers',
    client_types_okay: 'Families with older kids, Active seniors, First-time South America travelers',
    client_types_bad: 'Budget-conscious travelers expecting cheap prices, Those wanting beach-only holidays, Travelers uncomfortable with long internal flights',
  },
  'australia': {
    client_types_good: 'Families, Self-drive adventurers, First-time long-haul travelers, Honeymooners, Food & wine enthusiasts, Active retirees',
    client_types_okay: 'Budget-conscious travelers (if focused on one region), Solo travelers, Luxury seekers',
    client_types_bad: 'Travelers who dislike long flights, Those wanting a compact week-long trip (too spread out)',
  },
  'austria': {
    client_types_good: 'Music & culture lovers, Families, History buffs, Foodies, Hikers in summer, Skiers in winter, Christmas market fans',
    client_types_okay: 'Honeymooners (as part of a wider Europe trip), Active seniors, Self-drive road trippers',
    client_types_bad: 'Beach seekers, Budget travelers on a tight budget, Those wanting nightlife-focused trips',
  },
  'azores': {
    client_types_good: 'Nature lovers, Hikers & outdoor enthusiasts, Whale watchers, Off-the-beaten-path seekers, Photography enthusiasts',
    client_types_okay: 'Couples wanting a quieter alternative to mainland Portugal, Active seniors, Budget-conscious travelers',
    client_types_bad: 'Beach resort seekers (limited sandy beaches), Nightlife seekers, Those wanting guaranteed sunshine, Families with very young children',
  },
  'belgium': {
    client_types_good: 'Foodies & beer/chocolate enthusiasts, History & WWI buffs, Art lovers (Bruges, Ghent), Short-trip add-on for wider Europe itinerary',
    client_types_okay: 'Families on a short European break, First-time Europe travelers as a city add-on',
    client_types_bad: 'Adventure seekers, Beach seekers, Those wanting a full week-long standalone destination',
  },
  'belize': {
    client_types_good: 'Divers & snorkelers, Adventure seekers, Honeymooners wanting jungle + beach, Families with older kids, Nature lovers',
    client_types_okay: 'Budget-conscious couples, First-time Central America travelers, Birders',
    client_types_bad: 'Luxury resort seekers (limited high-end options), Those wanting big-city culture, Travelers uncomfortable with basic infrastructure in rural areas',
  },
  'bhutan': {
    client_types_good: 'Spiritual/mindful travelers, Trekkers, Photography enthusiasts, Bucket-list seekers, Travelers wanting truly unique cultural immersion',
    client_types_okay: 'Active couples, Fit seniors, Add-on to India or Nepal',
    client_types_bad: 'Budget travelers (daily tariff is high), Luxury resort seekers, Families with young children, Those wanting nightlife or beach',
  },
  'bolivia': {
    client_types_good: 'Adventurous travelers, Off-the-beaten-path seekers, Photography enthusiasts (Salar de Uyuni), Budget-conscious backpacker-style clients',
    client_types_okay: 'Active couples, Cultural immersion seekers, Combined with Peru or Chile',
    client_types_bad: 'Luxury seekers (limited high-end hotels), Those with altitude sensitivity, Families with young children, First-time international travelers',
  },
  'botswana': {
    client_types_good: 'Safari purists, Honeymooners, Luxury seekers, Photography enthusiasts, Repeat Africa visitors wanting exclusive experiences',
    client_types_okay: 'Families with older children, Active seniors, Self-drive adventurers (Chobe/Makgadikgadi)',
    client_types_bad: 'Budget travelers (premium destination), Beach seekers, Those wanting cultural/city experiences, First-time Africa travelers on a budget',
  },
  'brazil': {
    client_types_good: 'Adventure seekers, Beach lovers, Nature enthusiasts (Amazon, Pantanal), Cultural immersion fans, Honeymooners wanting variety',
    client_types_okay: 'Families with older kids, Food & drink enthusiasts, Self-drive travelers (certain regions)',
    client_types_bad: 'Those uncomfortable with language barriers, Safety-anxious travelers, Budget travelers expecting short internal distances, First-time international travelers',
  },
  'cambodia': {
    client_types_good: 'History & temple enthusiasts (Angkor Wat), Cultural immersion seekers, Budget-conscious travelers, Photography enthusiasts, Couples',
    client_types_okay: 'Families with older children, Add-on to Vietnam or Thailand, First-time Asia travelers',
    client_types_bad: 'Luxury resort seekers (limited outside Siem Reap), Beach-only travelers, Those uncomfortable with developing-world infrastructure',
  },
  'canada-east': {
    client_types_good: 'Families, History buffs, Foodies (Montreal/Quebec), Whale watchers, Active seniors, Self-drive road trippers, Fall foliage seekers',
    client_types_okay: 'First-time international travelers, Honeymooners, Cruise add-on travelers',
    client_types_bad: 'Adventure seekers wanting wilderness (better suited to West), Beach seekers, Budget travelers during peak fall season',
  },
  'canada-west': {
    client_types_good: 'Outdoor adventurers, Wildlife enthusiasts (bears, whales), Family road trippers, Scenic train lovers (Rocky Mountaineer), Skiers',
    client_types_okay: 'Honeymooners, Active seniors, Luxury seekers (mountain lodges), Cruise add-on',
    client_types_bad: 'Beach/resort seekers, Those wanting cultural city experiences, Budget travelers in peak summer',
  },
  'chile': {
    client_types_good: 'Adventure travelers (Patagonia, Atacama), Wine enthusiasts, Honeymooners wanting diverse landscapes, Photography enthusiasts',
    client_types_okay: 'Active families with older teens, Self-drive travelers, Luxury seekers (boutique lodges), Combined with Argentina',
    client_types_bad: 'Beach resort seekers, Budget travelers, Those uncomfortable with remote areas, Families with young children',
  },
  'china': {
    client_types_good: 'History & culture enthusiasts, Foodies, First-time Asia visitors wanting iconic sites (Great Wall, Terracotta Warriors), Family travelers',
    client_types_okay: 'Active seniors, Photography enthusiasts, Self-drive adventurers (rural areas), Business travelers extending a trip',
    client_types_bad: 'Those uncomfortable with language barriers, Independent travelers who dislike guided tours, Budget backpackers',
  },
  'colombia': {
    client_types_good: 'Adventure seekers, Foodies & coffee lovers, Art & architecture fans (Cartagena, Bogota), Off-the-beaten-path explorers, Budget-conscious couples',
    client_types_okay: 'Honeymooners (Cartagena + coffee region), Families with older kids, Bird watchers',
    client_types_bad: 'Safety-anxious travelers, Luxury resort seekers, First-time international travelers with no Spanish, Those wanting a relaxing beach-only trip',
  },
  'cook-islands': {
    client_types_good: 'Honeymooners, Beach lovers wanting a quieter alternative to Fiji, Couples seeking romance & relaxation, Off-the-beaten-path island seekers',
    client_types_okay: 'Families with older children, Divers & snorkelers, Active travelers (hiking Rarotonga)',
    client_types_bad: 'Nightlife seekers, Those wanting resort mega-complexes, Budget travelers (remote = expensive flights), Culture/history focused travelers',
  },
  'costa-rica': {
    client_types_good: 'Families (especially with young kids), Nature & wildlife lovers, Honeymooners wanting adventure + beach, Birders, First-time Central America travelers',
    client_types_okay: 'Active seniors, Self-drive travelers, Budget-conscious couples, Adventure seekers',
    client_types_bad: 'Luxury beach resort seekers, Culture/history focused travelers, Those wanting nightlife, Travelers who dislike humidity',
  },
  'croatia': {
    client_types_good: 'Honeymooners, Foodies & wine lovers, History buffs (Dubrovnik, Split), Sailing/cruise enthusiasts, Couples and groups of friends',
    client_types_okay: 'Families with older kids, Active seniors, Beach seekers (pebble beaches), First-time Europe travelers',
    client_types_bad: 'Budget travelers in peak summer (very expensive Jul-Aug), Those wanting sandy beaches, Solo travelers on a budget',
  },
  'cuba': {
    client_types_good: 'Cultural immersion seekers, History buffs, Music & dance enthusiasts, Photography lovers, Travelers wanting a truly unique experience',
    client_types_okay: 'Couples, Active seniors, Add-on to other Caribbean',
    client_types_bad: 'Luxury seekers (limited high-end infrastructure), Beach resort seekers, Those uncomfortable with basic amenities, Families with young children',
  },
  'czech-republic-prague': {
    client_types_good: 'History & architecture buffs, Beer enthusiasts, Budget-friendly Europe seekers, City-break travelers, First-time Europe visitors',
    client_types_okay: 'Honeymooners (as part of wider Europe trip), Families, Foodies',
    client_types_bad: 'Beach seekers, Adventure/outdoors travelers, Those wanting a week-long standalone destination',
  },
  'denmark': {
    client_types_good: 'Design & architecture lovers, Foodies (New Nordic cuisine), Families (Legoland, Tivoli), Cycling enthusiasts, Hygge-seekers',
    client_types_okay: 'Honeymooners (combined with wider Scandinavia), History buffs, City-break travelers',
    client_types_bad: 'Budget travelers (expensive), Beach/sun seekers, Those wanting warm weather, Adventure travelers',
  },
  'ecuador': {
    client_types_good: 'Birders & nature enthusiasts, Adventure seekers, Budget-conscious travelers wanting diversity, Families wanting a compact South America experience',
    client_types_okay: 'Combined with Galapagos, Cultural immersion seekers, Active seniors, Photography enthusiasts',
    client_types_bad: 'Luxury resort seekers, Beach-only travelers, Those with altitude concerns (Quito at 9,350ft)',
  },
  'egypt': {
    client_types_good: 'History & archaeology buffs, Bucket-list travelers (Pyramids), First-time Africa/Middle East visitors, Nile cruise seekers, Families with older kids',
    client_types_okay: 'Honeymooners (luxury Nile cruises), Budget travelers, Divers (Red Sea), Active seniors',
    client_types_bad: 'Those uncomfortable with persistent touts/hassle, Solo female travelers who prefer ease, Luxury seekers wanting Western-standard service throughout, Those sensitive to heat',
  },
  'england': {
    client_types_good: 'First-time international travelers, History buffs, Literature & theater lovers, Families, Foodies, Garden enthusiasts, Anglophiles',
    client_types_okay: 'Honeymooners (Cotswolds, Lake District), Active seniors, Self-drive road trippers, Luxury seekers',
    client_types_bad: 'Sun seekers, Budget travelers (London is expensive), Adventure seekers wanting adrenaline, Beach resort seekers',
  },
  'fiji': {
    client_types_good: 'Honeymooners, Families (especially with young kids — very family-friendly culture), Beach lovers, Divers & snorkelers',
    client_types_okay: 'Couples celebrating milestones, Multigenerational groups, Relaxation seekers',
    client_types_bad: 'History/culture-focused travelers, Adventure seekers, Budget travelers (remote islands are expensive), Solo travelers seeking social scenes',
  },
  'finland': {
    client_types_good: 'Northern lights seekers, Winter activity lovers (husky sledding, ice hotels), Families (Santa Claus Village), Nature & wilderness lovers, Design enthusiasts',
    client_types_okay: 'Honeymooners (winter Lapland), Summer hikers, Active seniors, Sauna & wellness seekers',
    client_types_bad: 'Beach seekers, Budget travelers (expensive), Nightlife seekers, Those who dislike cold weather',
  },
  'france': {
    client_types_good: 'Honeymooners, Foodies & wine lovers, Art & culture enthusiasts, Families, Luxury seekers, First-time Europe travelers',
    client_types_okay: 'Active seniors, Beach seekers (Riviera, Corsica), History buffs, Self-drive road trippers (Provence, Loire)',
    client_types_bad: 'Budget travelers (especially Paris), Adventure seekers, Those uncomfortable with language barriers outside Paris',
  },
  'french-polynesia': {
    client_types_good: 'Honeymooners & romantic couples, Luxury seekers, Divers & snorkelers, Bucket-list overwater bungalow dreamers',
    client_types_okay: 'Milestone anniversary couples, Whale watching enthusiasts (Jul-Nov), Photography enthusiasts',
    client_types_bad: 'Budget travelers (very expensive), Families with young children, Those wanting cultural depth, Nightlife seekers, Solo travelers',
  },
  'galapagos': {
    client_types_good: 'Wildlife & nature enthusiasts, Bucket-list travelers, Photography lovers, Families with curious older kids, Science/nature nerds',
    client_types_okay: 'Honeymooners wanting an adventure honeymoon, Active seniors with good mobility, Divers',
    client_types_bad: 'Budget travelers (expensive permits + cruises), Beach resort seekers, Nightlife seekers, Those prone to seasickness, Luxury resort seekers wanting pampering',
  },
  'germany': {
    client_types_good: 'History buffs, Self-drive road trippers (Romantic Road, Rhine), Beer & food enthusiasts, Families, Christmas market lovers, River cruise seekers',
    client_types_okay: 'First-time Europe travelers, Active seniors, Honeymooners (as part of wider Europe trip), Music lovers',
    client_types_bad: 'Beach seekers, Those wanting a single compact city-break (too spread out), Budget travelers during Oktoberfest',
  },
  'greece': {
    client_types_good: 'Honeymooners, Beach lovers, History buffs, Foodies, Island-hopping enthusiasts, Families, Couples celebrating milestones',
    client_types_okay: 'First-time Europe travelers, Active seniors, Sailing enthusiasts, Photography lovers, Solo travelers',
    client_types_bad: 'Budget travelers in peak summer (Jul-Aug islands very expensive), Adventure seekers, Those wanting exclusively luxury service standards',
  },
  'guatemala': {
    client_types_good: 'Cultural immersion seekers, History buffs (Mayan ruins), Off-the-beaten-path explorers, Photography enthusiasts, Budget-conscious adventurers',
    client_types_okay: 'Combined with Belize or Mexico, Active couples, Birders, Spanish-language learners',
    client_types_bad: 'Luxury seekers, Beach resort travelers, Safety-anxious travelers, Families with young children, First-time international travelers',
  },
  'honduras': {
    client_types_good: 'Divers (Bay Islands/Utila — world-class reef), Off-the-beaten-path adventurers, Mayan history enthusiasts (Copán)',
    client_types_okay: 'Budget-conscious divers, Combined with Guatemala or Belize, Bird watchers',
    client_types_bad: 'Luxury seekers, Safety-anxious travelers, Beach resort seekers, Families with young children, First-time international travelers',
  },
  'hungary-budapest': {
    client_types_good: 'History & architecture fans, Thermal bath/spa lovers, Foodies, Budget-friendly Europe seekers, City-break travelers',
    client_types_okay: 'Honeymooners (as part of Danube trip), First-time Europe visitors, Nightlife seekers, Combined with Prague/Vienna',
    client_types_bad: 'Beach seekers, Adventure travelers, Those wanting a full week-long destination (best as a city add-on)',
  },
  'iceland': {
    client_types_good: 'Nature & landscape lovers, Self-drive road trippers (Ring Road), Northern lights seekers, Photographers, Adventure seekers, Honeymooners wanting something unique',
    client_types_okay: 'Families with older kids, Active seniors, Geothermal spa seekers, Whale watchers',
    client_types_bad: 'Budget travelers (very expensive), Beach/sun seekers, Those who dislike unpredictable weather, Nightlife seekers',
  },
  'india': {
    client_types_good: 'Cultural immersion seekers, History & architecture buffs (Taj Mahal, Rajasthan), Foodies, Wildlife enthusiasts (tiger safaris), Luxury seekers (palace hotels)',
    client_types_okay: 'Families with older kids, Active seniors (Golden Triangle is manageable), Spiritual/yoga travelers, Photographers',
    client_types_bad: 'First-time international travelers who are anxious, Those sensitive to heat/crowds/sensory overload, Travelers wanting sanitized Western comfort, Budget backpackers expecting Audley service level',
  },
  'indonesia': {
    client_types_good: 'Honeymooners (Bali), Beach & resort lovers, Divers (Raja Ampat, Komodo), Cultural immersion seekers (Ubud), Families',
    client_types_okay: 'Adventure seekers (volcano trekking), Surfers, Luxury seekers (Bali), Solo travelers (Bali)',
    client_types_bad: 'Those wanting a compact trip (archipelago = lots of travel), History-focused travelers, Travelers uncomfortable with developing infrastructure outside Bali',
  },
  'ireland': {
    client_types_good: 'First-time international travelers, Self-drive road trippers, History & literary buffs, Pub culture enthusiasts, Families, Golf enthusiasts',
    client_types_okay: 'Active seniors, Honeymooners, Hikers (Wild Atlantic Way), Genealogy/heritage travelers',
    client_types_bad: 'Sun/beach seekers, Luxury resort seekers, Those wanting guaranteed good weather, Budget travelers in peak summer',
  },
  'israel': {
    client_types_good: 'History & archaeology buffs, Religious pilgrims, Foodies (Tel Aviv food scene), Cultural immersion seekers, Couples',
    client_types_okay: 'Families with older kids, Desert adventure seekers (Negev), Beach lovers (Tel Aviv, Dead Sea), First-time Middle East travelers',
    client_types_bad: 'Safety-anxious travelers, Budget travelers, Those uncomfortable with security checkpoints, Large group travelers',
  },
  'italy': {
    client_types_good: 'Honeymooners, Foodies & wine lovers, Art & history enthusiasts, Families, First-time Europe travelers, Luxury seekers',
    client_types_okay: 'Active seniors, Beach seekers (Amalfi, Sardinia), Self-drive road trippers (Tuscany), Solo travelers',
    client_types_bad: 'Budget travelers in peak summer, Adventure seekers wanting wilderness, Those wanting to avoid crowds at major sites',
  },
  'japan': {
    client_types_good: 'Cultural immersion seekers, Foodies, Cherry blossom/autumn foliage chasers, Train enthusiasts, Couples, Solo travelers, Photographers',
    client_types_okay: 'Families with older kids, Active seniors, Luxury seekers (ryokans), Hikers (Kumano Kodo), First-time Asia travelers',
    client_types_bad: 'Budget travelers in peak season, Those uncomfortable with language barriers, Travelers wanting beach holidays, Those needing large hotel rooms',
  },
  'jordan': {
    client_types_good: 'History buffs (Petra), Adventure seekers (Wadi Rum), Bucket-list travelers, Families with older kids, First-time Middle East visitors',
    client_types_okay: 'Honeymooners (Petra + Dead Sea), Active seniors, Photography enthusiasts, Combined with Israel or Egypt',
    client_types_bad: 'Beach resort seekers, Luxury-only travelers (limited high-end outside Amman), Budget travelers, Nightlife seekers',
  },
  'kenya': {
    client_types_good: 'Safari enthusiasts, Bucket-list travelers (Great Migration), Honeymooners (safari + beach), Families, Photography lovers',
    client_types_okay: 'Active seniors, First-time Africa visitors, Solo travelers, Beach lovers (Diani, Lamu)',
    client_types_bad: 'Budget travelers (good safaris are expensive), Luxury beach-only seekers (better options elsewhere), Those uncomfortable with wildlife proximity',
  },
  'kyrgyzstan': {
    client_types_good: 'Adventure seekers, Trekkers & horse riders, Off-the-beaten-path explorers, Photography enthusiasts, Budget-conscious travelers wanting Central Asia',
    client_types_okay: 'Cultural immersion seekers, Combined with Uzbekistan, Active couples',
    client_types_bad: 'Luxury seekers, Families with young children, Those wanting modern tourist infrastructure, First-time international travelers, Comfort-focused travelers',
  },
  'laos': {
    client_types_good: 'Off-the-beaten-path seekers, Cultural immersion lovers, Budget-conscious travelers, Temple & monastery enthusiasts, Relaxed pace travelers',
    client_types_okay: 'Couples, Combined with Vietnam or Cambodia, Kayakers & outdoor enthusiasts, Foodies, Active seniors',
    client_types_bad: 'Luxury resort seekers, Beach travelers, Those wanting modern infrastructure, Nightlife seekers, Families with very young children',
  },
  'luxembourg': {
    client_types_good: 'History & castle enthusiasts, Hikers (Mullerthal Trail), Add-on to Belgium/Germany/France itinerary',
    client_types_okay: 'Foodies & wine lovers (Moselle), First-time Europe visitors wanting a compact sampler',
    client_types_bad: 'Those wanting a full standalone destination, Beach seekers, Adventure seekers, Budget travelers, Nightlife seekers',
  },
  'madagascar': {
    client_types_good: 'Wildlife & nature enthusiasts (lemurs), Off-the-beaten-path adventurers, Photographers, Birders, Intrepid travelers',
    client_types_okay: 'Active couples, Beach lovers (combine with east coast), Combined with East Africa safari',
    client_types_bad: 'Luxury seekers, Comfort-focused travelers (roads are rough), Families with young children, Those with tight schedules (unpredictable logistics), First-time international travelers',
  },
  'malawi': {
    client_types_good: 'Off-the-beaten-path Africa seekers, Divers & snorkelers (Lake Malawi), Honeymooners wanting unique & intimate, Birders',
    client_types_okay: 'Budget-conscious safari goers, Combined with Zambia or Tanzania, Beach lovers (freshwater lake beaches)',
    client_types_bad: 'Luxury seekers wanting five-star lodges, Big Five safari seekers, Those wanting modern infrastructure, Families with very young children',
  },
  'malaysia': {
    client_types_good: 'Foodies, Families, Beach & island seekers (Langkawi, Perhentians), Budget-conscious travelers, Cultural immersion seekers',
    client_types_okay: 'Honeymooners (islands), Hikers (Cameron Highlands), First-time Asia travelers, Active seniors, Combined with Singapore',
    client_types_bad: 'Luxury-only seekers (outside KL), History-focused travelers, Nightlife seekers (outside KL), Those wanting a single iconic highlight',
  },
  'malaysian-borneo': {
    client_types_good: 'Wildlife enthusiasts (orangutans), Divers & snorkelers (Sipadan), Off-the-beaten-path adventurers, Nature photographers, Jungle trekkers',
    client_types_okay: 'Families with older kids, Active couples, Combined with Peninsular Malaysia, Birders',
    client_types_bad: 'Luxury resort seekers, Beach-only travelers, Comfort-focused travelers, Those who dislike humidity, First-time international travelers',
  },
  'maldives': {
    client_types_good: 'Honeymooners, Luxury seekers, Beach & relaxation lovers, Divers & snorkelers, Milestone celebration travelers',
    client_types_okay: 'Families (family-friendly resorts exist), Water sports enthusiasts, Wellness/spa seekers, Combined with Sri Lanka or India',
    client_types_bad: 'Budget travelers, Culture/history seekers, Adventure seekers, Those who bore easily (island life is quiet), Solo travelers, Nightlife seekers',
  },
  'mauritius': {
    client_types_good: 'Honeymooners, Families, Beach lovers, Water sports enthusiasts, Couples wanting an easy tropical getaway',
    client_types_okay: 'Divers & snorkelers, Hikers (Le Morne, Black River Gorges), Combined with Madagascar or South Africa, Luxury seekers, Active seniors',
    client_types_bad: 'Budget travelers, Culture/history-focused travelers, Adventure seekers wanting variety, Solo travelers',
  },
  'mexico': {
    client_types_good: 'Foodies, Cultural immersion seekers, Families, Honeymooners, History buffs (Mayan ruins), First-time international travelers, Beach lovers',
    client_types_okay: 'Adventure seekers, Self-drive road trippers (Yucatan, Baja), Solo travelers, Divers (cenotes, Cozumel), Active seniors',
    client_types_bad: 'Those wanting exclusively all-inclusive resort experiences (not our model), Safety-anxious travelers, Budget backpackers expecting Audley service',
  },
  'morocco': {
    client_types_good: 'Cultural immersion seekers, Foodies, Photography enthusiasts, Desert adventurers, Design & riad lovers, Couples',
    client_types_okay: 'Families with older kids, Active seniors, Hikers (Atlas Mountains), First-time Africa visitors, Combined with Spain or Portugal',
    client_types_bad: 'Solo female travelers wanting total ease, Those uncomfortable with haggling/medina navigation, Luxury beach resort seekers, Budget travelers expecting Western prices',
  },
  'multi-country-trips': {
    client_types_good: 'Travelers wanting to maximize a long trip, First-time regional visitors wanting highlights, Bucket-list travelers combining iconic destinations',
    client_types_okay: 'Couples, Families with older kids, Active seniors',
    client_types_bad: 'Those who prefer depth over breadth, Travelers who dislike frequent packing/moving, Budget-conscious travelers (multi-country = higher cost)',
  },
  'myanmar': {
    client_types_good: 'Cultural immersion seekers, Temple & pagoda enthusiasts, Off-the-beaten-path travelers, Photography enthusiasts',
    client_types_okay: 'Couples, Active seniors, Combined with other SE Asia destinations',
    client_types_bad: 'Luxury seekers (limited infrastructure), Beach-only travelers, Families with young children, Those concerned about political situation',
  },
  'namibia': {
    client_types_good: 'Self-drive adventurers, Photography enthusiasts (Sossusvlei, Etosha), Off-the-beaten-path safari seekers, Landscape lovers, Couples',
    client_types_okay: 'Families with older kids, Active seniors, Honeymooners (luxury desert lodges), Combined with Botswana or South Africa',
    client_types_bad: 'Those uncomfortable with long driving distances, Budget travelers, Those expecting Big Five safari (limited rhino/buffalo), Travelers wanting lush green landscapes',
  },
  'nepal': {
    client_types_good: 'Trekkers & hikers, Adventure seekers, Cultural immersion enthusiasts, Wildlife lovers (Chitwan), Budget-conscious travelers, Photography enthusiasts',
    client_types_okay: 'Active seniors (shorter treks), Spiritual travelers, Combined with India or Bhutan, Families with older teens',
    client_types_bad: 'Luxury seekers, Beach travelers, Those with altitude concerns, Comfort-focused travelers, Families with young children',
  },
  'netherlands': {
    client_types_good: 'Art lovers (Van Gogh, Rijksmuseum), Cycling enthusiasts, History buffs, City-break travelers, Tulip season visitors (Apr)',
    client_types_okay: 'Families, First-time Europe visitors as a short add-on, Foodies, Combined with Belgium',
    client_types_bad: 'Beach seekers, Adventure travelers, Those wanting a week-long standalone destination, Budget travelers in peak season',
  },
  'new-zealand': {
    client_types_good: 'Adventure seekers, Self-drive road trippers, Nature & landscape lovers, Honeymooners, Hikers, Lord of the Rings fans, Wine enthusiasts',
    client_types_okay: 'Families, Active seniors, Luxury lodge seekers, Photographers, Combined with Australia',
    client_types_bad: 'Budget travelers, Beach resort seekers, Culture/history focused travelers, Those who dislike long flights, Travelers wanting warm tropical weather',
  },
  'norway': {
    client_types_good: 'Nature & fjord lovers, Northern lights seekers, Hikers, Photographers, Cruise enthusiasts, Adventure seekers',
    client_types_okay: 'Families, Active seniors, Self-drive road trippers, Fishing enthusiasts, Combined with wider Scandinavia',
    client_types_bad: 'Budget travelers (very expensive), Beach/sun seekers, Nightlife seekers, Those who dislike cold/rain',
  },
  'oman': {
    client_types_good: 'Cultural immersion seekers, Self-drive adventurers, Families, Desert lovers, Off-the-beaten-path Middle East explorers, Couples',
    client_types_okay: 'Honeymooners, Divers (Musandam), Beach seekers (combined with desert), Active seniors, First-time Middle East travelers',
    client_types_bad: 'Budget travelers, Nightlife seekers, Those wanting vibrant city life, Solo female travelers wanting total ease',
  },
  'orient-express-trains': {
    client_types_good: 'Luxury seekers, Train enthusiasts, Honeymooners, Milestone celebration travelers, Those wanting a once-in-a-lifetime experience',
    client_types_okay: 'Active seniors, Couples celebrating anniversaries, Add-on to European itinerary',
    client_types_bad: 'Budget travelers, Families with young children, Adventure seekers, Those who get restless on long journeys, Solo travelers on a budget',
  },
  'panama': {
    client_types_good: 'Beach & island seekers (San Blas, Bocas del Toro), Families, Off-the-beaten-path explorers, Birders, Divers',
    client_types_okay: 'Honeymooners, Combined with Costa Rica, History buffs (Panama Canal), Self-drive travelers',
    client_types_bad: 'Luxury resort seekers (limited), Culture/history-focused travelers, Those wanting a well-developed tourist infrastructure, Nightlife seekers',
  },
  'paraguay': {
    client_types_good: 'Off-the-beaten-path South America seekers, Combined with Argentina or Brazil trip',
    client_types_okay: 'Cultural curiosity travelers, Birders (Chaco region)',
    client_types_bad: 'Luxury seekers, Beach travelers, First-time international travelers, Those wanting well-established tourist infrastructure, Families',
  },
  'peru': {
    client_types_good: 'Bucket-list travelers (Machu Picchu), History & archaeology buffs, Foodies (Lima), Trekkers (Inca Trail), Families with older kids',
    client_types_okay: 'Honeymooners, Active seniors (with altitude awareness), Photography enthusiasts, Cultural immersion seekers, Combined with Bolivia',
    client_types_bad: 'Those with serious altitude sensitivity, Beach resort seekers, Luxury-only travelers (outside Lima), Budget travelers in peak season',
  },
  'philippines': {
    client_types_good: 'Beach & island lovers, Divers & snorkelers, Honeymooners wanting tropical beauty on a budget, Off-the-beaten-path seekers, Water sports enthusiasts',
    client_types_okay: 'Families with older kids, Adventure seekers, Photographers, Combined with wider SE Asia',
    client_types_bad: 'Luxury resort seekers (limited ultra-luxury), Those uncomfortable with basic inter-island transport, First-time international travelers, Culture/history-focused travelers',
  },
  'portugal': {
    client_types_good: 'Foodies & wine lovers, Beach seekers (Algarve), Solo travelers, History buffs, Budget-conscious Europe seekers, Couples, Active seniors',
    client_types_okay: 'Families, Honeymooners, Hikers (Camino, Azores), Surfers, First-time Europe travelers',
    client_types_bad: 'Adventure seekers wanting adrenaline, Luxury mega-resort seekers, Those wanting nightlife beyond Lisbon/Porto',
  },
  'river-cruises': {
    client_types_good: 'Active seniors, Foodies & wine lovers, History & culture enthusiasts, Relaxation seekers wanting a floating hotel, Couples celebrating milestones',
    client_types_okay: 'Multigenerational groups, First-time Europe travelers, Photography enthusiasts',
    client_types_bad: 'Adventure seekers, Young couples wanting nightlife, Budget travelers, Families with young children, Independent travelers who dislike group settings',
  },
  'rwanda': {
    client_types_good: 'Gorilla trekking bucket-listers, Wildlife & primate enthusiasts, Off-the-beaten-path Africa seekers, Photography enthusiasts, Luxury safari seekers',
    client_types_okay: 'Honeymooners wanting a unique experience, Active seniors with good fitness, Combined with Uganda or Tanzania',
    client_types_bad: 'Budget travelers (gorilla permits are expensive), Beach seekers, Families with young children, Those with limited mobility (trekking is strenuous)',
  },
  'sardinia': {
    client_types_good: 'Beach lovers, Self-drive road trippers, Foodies, Couples wanting a quieter Italian island, Off-the-beaten-path Italy seekers',
    client_types_okay: 'Families, Honeymooners, Hikers, Active seniors, Combined with mainland Italy',
    client_types_bad: 'Budget travelers in peak summer, History/art-focused travelers (limited compared to mainland), Nightlife seekers, Those who want a non-driving holiday',
  },
  'scotland': {
    client_types_good: 'Whisky enthusiasts, Hikers & outdoors lovers, History buffs (castles, battlefields), Self-drive road trippers, Train lovers (Royal Scotsman)',
    client_types_okay: 'Families, Honeymooners (Scottish Highlands), Active seniors, Golf enthusiasts, Wildlife watchers, Combined with England',
    client_types_bad: 'Sun/beach seekers, Luxury resort seekers, Budget travelers, Those wanting guaranteed good weather',
  },
  'seychelles': {
    client_types_good: 'Honeymooners, Beach lovers, Luxury seekers, Divers & snorkelers, Couples celebrating milestones',
    client_types_okay: 'Families, Nature lovers (unique flora/fauna), Photographers, Combined with East Africa safari',
    client_types_bad: 'Budget travelers, Culture/history seekers, Adventure seekers, Solo travelers, Nightlife seekers',
  },
  'singapore': {
    client_types_good: 'Foodies, Luxury seekers, Families (Gardens by the Bay, zoo), Stopover travelers, First-time Asia visitors, Design & architecture lovers',
    client_types_okay: 'Couples on a wider SE Asia trip, Business travelers extending a stay, Shopping enthusiasts',
    client_types_bad: 'Budget travelers, Beach seekers, Those wanting a week-long standalone destination, Adventure seekers, Off-the-beaten-path explorers',
  },
  'south-africa': {
    client_types_good: 'Safari enthusiasts, Honeymooners (safari + Cape Town + wine), Families, Foodies & wine lovers, Self-drive road trippers, First-time Africa visitors',
    client_types_okay: 'Active seniors, Adventure seekers (cage diving, bungee), Beach lovers (Garden Route), Solo travelers, Combined with Victoria Falls',
    client_types_bad: 'Safety-anxious travelers (car safety concerns in cities), Budget travelers wanting cheap safaris, Those wanting exclusively remote wilderness safari',
  },
  'south-korea': {
    client_types_good: 'Foodies, K-culture enthusiasts, History & temple lovers, Solo travelers, Budget-conscious Asia seekers, City lovers (Seoul)',
    client_types_okay: 'Couples, Families with older kids, Active seniors, Spa/wellness seekers, Combined with Japan',
    client_types_bad: 'Beach resort seekers, Adventure/outdoors seekers, Luxury seekers wanting exclusive experiences, Those wanting a laid-back pace',
  },
  'spain': {
    client_types_good: 'Foodies & wine lovers, Art & architecture fans (Gaudi, Prado), Beach seekers, Couples, History buffs, Nightlife enthusiasts',
    client_types_okay: 'Families, Honeymooners, First-time Europe travelers, Self-drive road trippers, Active seniors, Solo travelers',
    client_types_bad: 'Off-the-beaten-path seekers (major cities are touristy), Budget travelers in peak summer, Adventure seekers wanting wilderness',
  },
  'sri-lanka': {
    client_types_good: 'Wildlife enthusiasts (leopards, elephants, whales), Beach lovers, Cultural immersion seekers, Budget-conscious honeymooners, Tea enthusiasts, Families',
    client_types_okay: 'Active seniors, Hikers (Horton Plains, Adam\'s Peak), Surfers, Combined with Maldives, History buffs (Sigiriya)',
    client_types_bad: 'Luxury-only travelers (limited ultra-luxury), Those wanting a single beach resort experience, Travelers uncomfortable with developing infrastructure',
  },
  'sweden': {
    client_types_good: 'Design & architecture lovers, Northern lights seekers (Lapland), Outdoor enthusiasts, Foodies (New Nordic), ICEHOTEL seekers',
    client_types_okay: 'Families (Stockholm), Active seniors, Honeymooners (combined with wider Scandinavia), Wellness seekers',
    client_types_bad: 'Budget travelers (expensive), Beach/sun seekers, Nightlife seekers, Those wanting warm weather, History-focused travelers',
  },
  'switzerland': {
    client_types_good: 'Scenic train enthusiasts (Glacier Express), Hikers, Families, Honeymoon couples, Skiers, Photography lovers, Foodies (cheese & chocolate)',
    client_types_okay: 'Active seniors, Luxury seekers, Self-drive road trippers, Combined with wider Europe (Austria, Italy, France)',
    client_types_bad: 'Budget travelers (very expensive), Beach seekers, Nightlife seekers, History/museum-focused travelers',
  },
  'tanzania': {
    client_types_good: 'Safari enthusiasts (Serengeti, Ngorongoro), Bucket-list travelers (Great Migration), Kilimanjaro trekkers, Honeymooners (safari + Zanzibar), Families',
    client_types_okay: 'Active seniors, Photography enthusiasts, First-time Africa visitors, Beach lovers (Zanzibar add-on)',
    client_types_bad: 'Budget travelers (premium safari destination), Luxury seekers wanting city experiences, Comfort-focused travelers (bush camps are rustic), Those with mobility limitations',
  },
  'thailand': {
    client_types_good: 'First-time Asia travelers, Beach lovers, Foodies, Honeymooners, Families, Budget-conscious travelers, Wellness/spa seekers',
    client_types_okay: 'Active seniors, Adventure seekers (climbing, kayaking), Solo travelers, Cultural immersion seekers, Combined with wider SE Asia',
    client_types_bad: 'Those wanting to avoid tourist crowds (main spots are busy), History-only focused travelers, Off-the-beaten-path purists',
  },
  'the-stans': {
    client_types_good: 'Silk Road history enthusiasts, Off-the-beaten-path explorers, Architecture & art lovers (Samarkand, Bukhara), Photography enthusiasts, Adventurous travelers',
    client_types_okay: 'Active couples, Trekkers (Kyrgyzstan mountains), Combined with wider Central Asia, Cultural immersion seekers',
    client_types_bad: 'Luxury seekers, Comfort-focused travelers, Families with young children, Beach seekers, First-time international travelers',
  },
  'tibet': {
    client_types_good: 'Spiritual seekers, Bucket-list travelers (Everest Base Camp), Cultural immersion enthusiasts, Trekkers, Photography lovers',
    client_types_okay: 'Active couples, Combined with China or Nepal, History enthusiasts',
    client_types_bad: 'Those with altitude sensitivity (average elevation 14,000ft+), Luxury seekers, Comfort-focused travelers, Families with children, Those wanting independent travel (guided tours required)',
  },
  'turkey': {
    client_types_good: 'History & archaeology buffs, Foodies, Hot air balloon seekers (Cappadocia), Honeymooners, Cultural immersion seekers, Beach + culture combos',
    client_types_okay: 'Families with older kids, Active seniors, First-time Middle East/crossroads travelers, Sailing enthusiasts (Turquoise Coast)',
    client_types_bad: 'Budget travelers in peak season, Solo female travelers in eastern regions, Luxury beach-only seekers, Nightlife-only seekers',
  },
  'uae': {
    client_types_good: 'Luxury seekers, Families (theme parks, beaches), First-time Middle East visitors, Stopover travelers, Shopping enthusiasts',
    client_types_okay: 'Honeymooners, Active seniors, Desert adventure seekers, Foodies, Business travelers extending a stay',
    client_types_bad: 'Budget travelers, Off-the-beaten-path seekers, History/culture purists, Those seeking authentic cultural immersion, Adventure seekers',
  },
  'uganda': {
    client_types_good: 'Gorilla & chimp trekkers, Off-the-beaten-path safari seekers, Birders, Adventure travelers, Budget-friendlier gorilla trekking (vs Rwanda)',
    client_types_okay: 'Families with older teens, Active seniors with good fitness, Photography enthusiasts, Combined with Rwanda or Kenya',
    client_types_bad: 'Luxury seekers, Beach travelers, Comfort-focused travelers, Those with limited mobility, First-time Africa travelers wanting easy logistics',
  },
  'uruguay': {
    client_types_good: 'Off-the-beaten-path South America seekers, Foodies & wine lovers, Beach lovers (Punta del Este, José Ignacio), Couples',
    client_types_okay: 'Families, Combined with Argentina (Buenos Aires day trip), Self-drive travelers, Active seniors',
    client_types_bad: 'Adventure seekers, History/culture-focused travelers, Budget travelers, Those wanting a packed itinerary with lots to see, Nightlife seekers (outside season)',
  },
  'usa-alaska': {
    client_types_good: 'Wildlife enthusiasts (bears, whales, eagles), Nature & wilderness lovers, Bucket-list travelers, Cruise seekers, Active seniors, Photographers',
    client_types_okay: 'Families with older kids, Fishing enthusiasts, Train lovers (Alaska Railroad), Adventure seekers, Self-drive road trippers',
    client_types_bad: 'Beach/sun seekers, Budget travelers, Those wanting cultural city experiences, Luxury resort seekers, Those who dislike remote areas',
  },
  'usa-california': {
    client_types_good: 'Families, Road trip enthusiasts (Pacific Coast Highway), Foodies & wine lovers (Napa, Sonoma), Beach lovers, Honeymooners, Theme park fans',
    client_types_okay: 'Active seniors, First-time US travelers, Hikers (Yosemite), Surfers, Solo travelers, City lovers (SF, LA)',
    client_types_bad: 'Budget travelers (expensive), Those wanting off-the-beaten-path, Culture/history-focused travelers',
  },
  'usa-hawaii': {
    client_types_good: 'Honeymooners, Families, Beach lovers, Snorkelers & divers, Whale watchers (winter), Active outdoor enthusiasts (volcano, hiking)',
    client_types_okay: 'Active seniors, Surfers, Luxury seekers, Milestone celebration travelers, Cultural immersion seekers (Hawaiian heritage)',
    client_types_bad: 'Budget travelers (expensive), History/architecture seekers, Off-the-beaten-path seekers, Solo travelers wanting social scenes',
  },
  'usa-national-parks': {
    client_types_good: 'Outdoor adventurers, Families, Photography enthusiasts, Road trip lovers, Hikers, Nature/landscape lovers, Bucket-list travelers',
    client_types_okay: 'Active seniors, Self-drive travelers, Combined with city experiences, Couples',
    client_types_bad: 'Luxury resort seekers, Beach seekers, Culture/history-focused travelers, Those with limited mobility (many parks require walking), Nightlife seekers',
  },
  'usa-new-england': {
    client_types_good: 'Fall foliage seekers, History buffs, Foodies (lobster, farm-to-table), Whale watchers, Active seniors, Self-drive road trippers',
    client_types_okay: 'Families, Honeymooners, Hikers (Appalachian Trail sections), College visit combiners',
    client_types_bad: 'Beach resort seekers, Budget travelers in peak fall, Those wanting warm winter travel, Nightlife seekers, Luxury resort seekers',
  },
  'uzbekistan': {
    client_types_good: 'Silk Road history enthusiasts, Architecture & art lovers, Photography enthusiasts, Off-the-beaten-path explorers, Cultural immersion seekers',
    client_types_okay: 'Active couples, Foodies, Combined with Kyrgyzstan, Active seniors',
    client_types_bad: 'Luxury seekers, Beach travelers, Families with young children, Comfort-focused travelers, Nightlife seekers',
  },
  'vietnam': {
    client_types_good: 'Foodies, Cultural immersion seekers, Budget-conscious travelers, Families, History buffs (war history), Honeymooners wanting variety, Motorcyclists/self-drivers',
    client_types_okay: 'Active seniors, Beach lovers (Phu Quoc, Hoi An), Adventure seekers (Ha Giang), Solo travelers, First-time Asia travelers',
    client_types_bad: 'Luxury-only seekers (outside major cities), Those wanting a laid-back pace (Vietnam is energetic), Travelers uncomfortable with motorbike traffic',
  },
  'zambia': {
    client_types_good: 'Safari purists (South Luangwa, Lower Zambezi), Victoria Falls bucket-listers, Off-the-beaten-path Africa seekers, Birders, Walking safari enthusiasts',
    client_types_okay: 'Honeymooners, Families with older kids, Combined with Botswana or Zimbabwe, Active seniors, Canoe safari seekers',
    client_types_bad: 'Budget travelers, Beach seekers, Luxury seekers wanting five-star city hotels, Comfort-focused travelers, First-time Africa visitors wanting easy logistics',
  },
  'zanzibar': {
    client_types_good: 'Beach lovers, Honeymooners, Post-safari relaxation seekers, Cultural immersion enthusiasts (Stone Town), Divers & snorkelers',
    client_types_okay: 'Families, Foodies (spice tours), Combined with Tanzania mainland, Active seniors',
    client_types_bad: 'Adventure seekers, Budget travelers wanting cheap beach holidays, Nightlife seekers, Those wanting a large resort experience, Solo travelers',
  },
  'zimbabwe': {
    client_types_good: 'Safari enthusiasts (Hwange, Mana Pools), Victoria Falls seekers, Off-the-beaten-path Africa explorers, Walking & canoe safari lovers, Photography enthusiasts',
    client_types_okay: 'Honeymooners (luxury camps + Falls), Active seniors, Families with older kids, Combined with Zambia or Botswana',
    client_types_bad: 'Budget travelers, Beach seekers, Comfort-focused travelers, Those wanting modern infrastructure, First-time Africa visitors wanting easy logistics',
  },
};

// ── Apply updates ─────────────────────────────────────────────────────────

async function run() {
  let pricingCount = 0;
  let clientCount = 0;

  // 1) Pricing tier updates
  for (const [slug, data] of Object.entries(pricingUpdates)) {
    const ref = db.collection('destinations').doc(slug);
    await ref.update({ pricing_tiers: data.pricing_tiers });
    pricingCount++;
    console.log(`  [pricing] ${slug}`);
  }

  // 2) Client type updates
  for (const [slug, data] of Object.entries(clientTypeUpdates)) {
    const ref = db.collection('destinations').doc(slug);
    await ref.update({
      client_types_good: data.client_types_good || null,
      client_types_okay: data.client_types_okay || null,
      client_types_bad: data.client_types_bad || null,
    });
    clientCount++;
    console.log(`  [client]  ${slug}`);
  }

  console.log(`\nDone: ${pricingCount} pricing updates, ${clientCount} client type updates.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

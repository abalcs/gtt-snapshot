import { getDb } from "@/../db/database";
import { getCached, setCache } from "./data-cache";
import { getContinentForDestination, getContinentOrder } from "./continents";

export interface TaAssignment {
  country: string;
  rank: number;
}

export interface Consultant {
  name: string;
  title: string;
  calendarUrl: string | null;
  destinations: string[];
  displayRegions: string[];
  countriesDisplay: string;
  disabledDestinations?: string[];
  taAssignments?: TaAssignment[];
}

export interface ConsultantDoc extends Consultant {
  id: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

const COLLECTION = "consultants";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function getActiveConsultants(): Promise<ConsultantDoc[]> {
  const cached = getCached<ConsultantDoc[]>("consultants:active");
  if (cached) return cached;

  const snap = await getDb()
    .collection(COLLECTION)
    .where("status", "==", "active")
    .get();

  const docs = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as ConsultantDoc[];

  return setCache("consultants:active", docs);
}

export async function getAllConsultantsAdmin(): Promise<ConsultantDoc[]> {
  const cached = getCached<ConsultantDoc[]>("consultants:all");
  if (cached) return cached;

  const snap = await getDb().collection(COLLECTION).get();
  const docs = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as ConsultantDoc[];

  return setCache("consultants:all", docs);
}

// Build maps of destination slug → continent name and slug → display name using
// the shared continents definitions. Firestore destinations provide the
// region_slug and name needed for lookups; override entries in continents.ts
// work without Firestore.
async function getDestSlugMaps(): Promise<{ continentMap: Map<string, string>; nameMap: Map<string, string> }> {
  const cached = getCached<{ continentMap: Map<string, string>; nameMap: Map<string, string> }>("dest-slug-maps");
  if (cached) return cached;

  const continentMap = new Map<string, string>();
  const nameMap = new Map<string, string>();

  try {
    const snap = await getDb()
      .collection("destinations")
      .where("status", "==", "active")
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      const regionSlug = (data.region_slug as string) ?? "";
      continentMap.set(doc.id, getContinentForDestination(doc.id, regionSlug));
      if (data.name) {
        nameMap.set(doc.id, data.name as string);
      }
    }
  } catch {
    // Firestore unavailable — override-based fallback used below
  }

  return setCache("dest-slug-maps", { continentMap, nameMap });
}

function continentForSlug(slug: string, destMap: Map<string, string>): string {
  return destMap.get(slug) ?? getContinentForDestination(slug, "");
}

// Fallback: turn a slug like "costa-rica" into "Costa Rica"
function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface DestinationOption {
  slug: string;
  name: string;
}

export async function getConsultantsByRegion(): Promise<{ region: string; consultants: Consultant[]; destinationOptions: DestinationOption[] }[]> {
  const [consultants, { continentMap, nameMap }] = await Promise.all([
    getActiveConsultants(),
    getDestSlugMaps(),
  ]);

  return getContinentOrder()
    .map((continent) => {
      const filtered = consultants.filter((c) => {
        const disabled = c.disabledDestinations || [];
        return c.destinations.some(
          (slug) =>
            !disabled.includes(slug) &&
            continentForSlug(slug, continentMap) === continent
        );
      });

      // Collect unique enabled destination slugs for this continent
      const destSlugs = new Set<string>();
      for (const c of filtered) {
        const disabled = c.disabledDestinations || [];
        for (const slug of c.destinations) {
          if (!disabled.includes(slug) && continentForSlug(slug, continentMap) === continent) {
            destSlugs.add(slug);
          }
        }
      }

      const destinationOptions = Array.from(destSlugs)
        .map((slug) => ({ slug, name: nameMap.get(slug) ?? slugToDisplayName(slug) }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return { region: continent, consultants: filtered, destinationOptions };
    })
    .filter(({ consultants }) => consultants.length > 0);
}

export async function getConsultantsForDestination(slug: string): Promise<Consultant[]> {
  const consultants = await getActiveConsultants();
  return consultants.filter(
    (c) =>
      c.destinations.includes(slug) &&
      c.calendarUrl !== null &&
      !(c.disabledDestinations || []).includes(slug)
  );
}

export { slugify };

/** Derive TA assignments from static COUNTRY_AGENT_ASSIGNMENTS for a given name */
export function getStaticTaAssignments(name: string): TaAssignment[] {
  const result: TaAssignment[] = [];
  const canonical = name.toLowerCase();
  for (const { country, agents } of COUNTRY_AGENT_ASSIGNMENTS) {
    const seen = new Set<string>();
    agents.forEach((csName, idx) => {
      const resolved = (TRAVEL_AGENT_NAME_ALIASES[csName] ?? csName).toLowerCase();
      if (seen.has(resolved)) return;
      seen.add(resolved);
      if (resolved === canonical) {
        result.push({ country, rank: idx + 1 });
      }
    });
  }
  return result;
}

/** Build a lookup of canonical lowercase name → TA country rankings (Firestore-first, static fallback) */
export async function getTaRanksByConsultant(): Promise<Record<string, TaAssignment[]>> {
  const consultants = await getActiveConsultants();
  const result: Record<string, TaAssignment[]> = {};
  for (const c of consultants) {
    const assignments = c.taAssignments && c.taAssignments.length > 0
      ? c.taAssignments
      : getStaticTaAssignments(c.name);
    if (assignments.length > 0) {
      result[c.name.toLowerCase()] = assignments;
    }
  }
  return result;
}

// ── Travel Agent Country Assignments ─────────────────────

/** Maps TA-table names to canonical Firestore/seed names */
export const TRAVEL_AGENT_NAME_ALIASES: Record<string, string> = {
  "Tam Frederick": "Tamatha Frederick",
  "Carly Rusticca": "Carly Ristuccia",
  "Jess Taylor": "Jessica Taylor",
  "Jason Toms": "Jason",
  "Kat DiPlacido": "Katarina DiPlacido",
  "Tyler NilssonGoodwin": "Tyler Nilsson-Goodwin",
  "Sebastion Pieri": "Sebastian Pieri",
};

/** Countries with agents listed in CS1→CS6 priority order */
export const COUNTRY_AGENT_ASSIGNMENTS: { country: string; agents: string[] }[] = [
  { country: "Japan", agents: ["Joy Rhinehart", "Tam Frederick", "Chris Flad", "Amy Rowland", "Kai Gundersen"] },
  { country: "Italy", agents: ["Amanda Brown", "Gudrun", "Leah Saulnier", "Sarah Quigley", "Carly Rusticca"] },
  { country: "Australia & NZ", agents: ["Connor Chess", "Anthony Vaglica", "Julia Criscuolo", "Devin O'Doherty"] },
  { country: "Thailand", agents: ["Jack Tydeman", "Matt McLean", "Zachary Vogel", "Julia Matton"] },
  { country: "Switzerland", agents: ["Sebastion Pieri", "Gudrun", "Brianna Zirolli"] },
  { country: "French Poly", agents: ["Connor Chess", "Anthony Vaglica", "Jess Taylor"] },
  { country: "Ireland", agents: ["Lily Cohen", "Heather Rufo", "Mareesa Ahmad"] },
  { country: "Portugal", agents: ["Corinne Landry", "Erika Jolie", "Riley Casadei"] },
  { country: "Iceland", agents: ["Mareesa Ahmad", "Kelsey White"] },
  { country: "France", agents: ["Caroline Fahey", "Kelly Edwards", "Sebastian Pieri"] },
  { country: "Egypt", agents: ["Kristen Ziino", "Lucy Celon", "Adam Shahin"] },
  { country: "South Africa", agents: ["Thora Taylor", "Laura Coughlin", "David Katwiwa"] },
  { country: "Scotland", agents: ["Lily Cohen", "Heather Rufo", "Mareesa Ahmad"] },
  { country: "Greece", agents: ["Laura Plansky", "Jeff Procopio", "Tess Creatura"] },
  { country: "Morocco", agents: ["Kristen Ziino", "Lucy Celon", "Adam Shahin"] },
  { country: "England", agents: ["Lily Cohen", "Heather Rufo", "Mareesa Ahmad"] },
  { country: "Tanzania", agents: ["Thora Taylor", "Laura Coughlin", "David Katwiwa"] },
  { country: "India", agents: ["Jason Toms", "Kat DiPlacido"] },
  { country: "Spain", agents: ["Corinne Landry", "Erika Jolie", "Riley Casadei", "Erika Jolie", "Riley Casadei"] },
  { country: "Indonesia", agents: ["Jack Tydeman", "Matt McLean", "Zachary Vogel"] },
  { country: "Peru/Ecuador", agents: ["Tyler NilssonGoodwin", "Jasmine Scott", "Nataly Solis-Alva", "Spencer Kulis"] },
  { country: "Costa Rica", agents: ["Jasmine Scott", "Spencer Kulis", "Eileen Dinn"] },
];

export interface CountryAgentEntry {
  taLabel: string; // "TA1", "TA2", etc.
  name: string; // display name
  consultant: Consultant | null; // matched Firestore record, or null
}

export interface CountryAgentGroup {
  country: string;
  agents: CountryAgentEntry[];
}

export async function getCountryAgentGroups(): Promise<CountryAgentGroup[]> {
  const consultants = await getActiveConsultants();

  // Build country groups from Firestore taAssignments (with static fallback)
  const countryMap = new Map<string, CountryAgentEntry[]>();

  for (const c of consultants) {
    const assignments = c.taAssignments && c.taAssignments.length > 0
      ? c.taAssignments
      : getStaticTaAssignments(c.name);

    for (const { country, rank } of assignments) {
      if (!countryMap.has(country)) countryMap.set(country, []);
      countryMap.get(country)!.push({
        taLabel: `TA${rank}`,
        name: c.name,
        consultant: {
          name: c.name,
          title: c.title,
          calendarUrl: c.calendarUrl,
          destinations: c.destinations,
          displayRegions: c.displayRegions,
          countriesDisplay: c.countriesDisplay,
        },
      });
    }
  }

  return Array.from(countryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([country, agents]) => ({
      country,
      agents: agents.sort((a, b) => {
        const rankA = parseInt(a.taLabel.slice(2));
        const rankB = parseInt(b.taLabel.slice(2));
        return rankA - rankB;
      }),
    }));
}

// ── Seed Data ───────────────────────────────────────────

export const SEED_CONSULTANTS: Consultant[] = [
  // === GREECE / ITALY / EUROPE ===
  {
    name: "Laura Plansky",
    title: "Turbo",
    calendarUrl: "https://outlook.office365.com/book/LauraPlansky1@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["greece", "italy", "france", "turkey"],
    displayRegions: ["Greece", "Italy"],
    countriesDisplay: "Greece, Italy, France, Turkey",
  },
  {
    name: "Jeff Procopio",
    title: "Turbo",
    calendarUrl: "https://outlook.office365.com/book/JeffProcopio@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["greece", "italy", "switzerland", "austria"],
    displayRegions: ["Greece", "Italy"],
    countriesDisplay: "Greece, Italy, Switzerland, Austria",
  },
  {
    name: "Matt Greenbaum",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/MattGreenbaum@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["greece", "italy"],
    displayRegions: ["Greece", "Italy"],
    countriesDisplay: "Greece, Italy",
  },
  {
    name: "Amanda Brown",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/AmandaBrown@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["greece", "italy", "croatia"],
    displayRegions: ["Greece", "Italy", "Croatia"],
    countriesDisplay: "Greece, Italy, Croatia",
  },
  {
    name: "Tess Creatura",
    title: "Onboard",
    calendarUrl: "https://outlook.office.com/book/TessCreatura@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["greece"],
    displayRegions: ["Greece"],
    countriesDisplay: "Greece",
  },
  {
    name: "Jasmine Morrill",
    title: "CS",
    calendarUrl: "https://outlook.office.com/book/JasmineMorrill@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["greece", "italy"],
    displayRegions: ["Greece", "Italy"],
    countriesDisplay: "Greece, Italy",
  },
  {
    name: "Sam Rubin",
    title: "Turbo",
    calendarUrl: null,
    destinations: ["greece", "italy", "croatia"],
    displayRegions: ["Greece", "Croatia"],
    countriesDisplay: "Greece, Italy, Croatia",
  },

  // === ITALY-ONLY SPECIALISTS ===
  {
    name: "Carly Ristuccia",
    title: "CS",
    calendarUrl: "https://outlook.office.com/book/CarlyRistuccia@audleytravel.com/",
    destinations: ["italy", "sardinia"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy, Sicily, Puglia, Sardinia",
  },
  {
    name: "Emily Hauryski",
    title: "Onboard",
    calendarUrl: "https://outlook.office.com/book/EmilyHauryski@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["italy"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy",
  },
  {
    name: "Jenna Barsness",
    title: "Onboard",
    calendarUrl: "https://outlook.office.com/book/JennaBarsnessItalySpecialist2@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["italy"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy",
  },
  {
    name: "Jenna Cunniff",
    title: "CS",
    calendarUrl: "https://outlook.office365.com/book/JennaCunniff@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["italy", "sardinia"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy, Sicily, Puglia, Sardinia",
  },
  {
    name: "Lauren Middleton",
    title: "CS",
    calendarUrl: "https://outlook.office.com/book/LaurenMiddleton1@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["italy", "sardinia"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy, Sicily, Puglia, Sardinia",
  },
  {
    name: "Leah Saulnier",
    title: "Onboard",
    calendarUrl: "https://outlook.office.com/book/LeahSaulnier@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["italy"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy",
  },
  {
    name: "Margaret O'Connell",
    title: "CS",
    calendarUrl: "https://outlook.office.com/book/MargaretOConnell@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["italy", "sardinia"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy, Sicily, Puglia, Sardinia",
  },
  {
    name: "Rebecca Mechura",
    title: "CS",
    calendarUrl: "https://outlook.office.com/book/RebeccaMechura@audleytravel.com/",
    destinations: ["italy", "sardinia"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy, Sicily, Puglia, Sardinia",
  },
  {
    name: "Roberto Sancho",
    title: "CS",
    calendarUrl: "https://outlook.office.com/book/RobertoSancho@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["italy", "sardinia"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy, Sicily, Puglia, Sardinia",
  },
  {
    name: "Sarah Quigley",
    title: "CS",
    calendarUrl: "https://outlook.office.com/book/SarahQuigley@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["italy", "sardinia"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy, Sicily, Puglia, Sardinia",
  },

  // === SCANDINAVIA ===
  {
    name: "Aislyn Emerson",
    title: "Elite",
    calendarUrl: "https://outlook.office365.com/book/AislynEmersonBookingCalendar@audleytravel.com/",
    destinations: ["sweden", "denmark", "norway", "switzerland", "croatia"],
    displayRegions: ["Scandinavia", "Croatia"],
    countriesDisplay: "Scandinavia, Switzerland, Croatia",
  },
  {
    name: "Julia Mole",
    title: "Senior",
    calendarUrl: "https://outlook.office.com/book/JuliaMole@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["sweden", "denmark", "norway"],
    displayRegions: ["Scandinavia"],
    countriesDisplay: "Scandinavia",
  },
  {
    name: "Sydney Marchand",
    title: "Onboard",
    calendarUrl: "https://outlook.office.com/book/SydneyMarchand@audleytravel.com/",
    destinations: ["sweden", "denmark", "norway"],
    displayRegions: ["Scandinavia"],
    countriesDisplay: "Scandinavia",
  },

  // === CROATIA-ONLY ===
  {
    name: "Lynn Macaluso",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/LynnMacaluso@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["croatia", "italy", "germany", "austria"],
    displayRegions: ["Croatia", "Italy"],
    countriesDisplay: "Croatia, Italy, Germany, Austria",
  },

  // === LATAM ===
  {
    name: "Ana Baratta Da Costa",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/AnaBarattadaCosta@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["chile", "bolivia", "brazil", "peru"],
    displayRegions: ["LATAM"],
    countriesDisplay: "Chile, Bolivia, Brazil, Peru",
  },
  {
    name: "Emma Gailey",
    title: "Turbo",
    calendarUrl: "https://outlook.office365.com/book/EmmaGailey@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["argentina", "chile", "antarctica", "belize"],
    displayRegions: ["LATAM"],
    countriesDisplay: "Argentina, Chile, Antarctica, Belize",
  },
  {
    name: "Sydney Jones",
    title: "Elite",
    calendarUrl: "https://outlook.office365.com/book/SydneyCayen1@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["argentina", "chile", "uruguay", "usa-national-parks"],
    displayRegions: ["LATAM", "USA"],
    countriesDisplay: "Argentina, Chile, Uruguay, Southwest/Rockies",
  },
  {
    name: "Piper Eskridge",
    title: "Turbo",
    calendarUrl: "https://outlook.office.com/book/PipersBookingCalendar@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["argentina", "chile", "canada-east", "canada-west", "usa-alaska", "usa-hawaii"],
    displayRegions: ["LATAM", "Canada", "USA"],
    countriesDisplay: "Argentina, Chile, Canada, Hawaii, Alaska",
  },
  {
    name: "Tamatha Frederick",
    title: "Cross",
    calendarUrl: "https://outlook.office365.com/book/TamathaFrederick@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["argentina", "chile"],
    displayRegions: ["LATAM"],
    countriesDisplay: "Argentina, Chile",
  },
  {
    name: "Eileen Dinn",
    title: "Senior",
    calendarUrl: "https://outlook.office.com/bookwithme/user/f943ace9449343ec8dacfb1242914e8d@audleytravel.com?anonymous&ismsaljsauthenabled",
    destinations: ["costa-rica", "ecuador", "guatemala"],
    displayRegions: ["LATAM"],
    countriesDisplay: "Costa Rica, Ecuador, Guatemala",
  },
  {
    name: "Spencer Kulis",
    title: "CS",
    calendarUrl: "https://outlook.office.com/bookwithme/user/76577d01b3334f50b4e734fb72876360@audleytravel.com?anonymous&ismsaljsauthenabled=true",
    destinations: ["costa-rica", "ecuador"],
    displayRegions: ["LATAM"],
    countriesDisplay: "Costa Rica, Ecuador",
  },
  {
    name: "Meghan Bergstrom",
    title: "Turbo",
    calendarUrl: "https://outlook.office365.com/book/MeghanBergstrom@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["brazil", "mexico", "belize", "guatemala", "canada-east", "canada-west", "usa-alaska"],
    displayRegions: ["LATAM", "Canada", "USA"],
    countriesDisplay: "Brazil, Mexico, Belize, Guatemala, Canada, Alaska",
  },
  {
    name: "Robyn Lipkowitz",
    title: "CS",
    calendarUrl: "https://outlook.office.com/bookwithme/user/101170a4320345baaaae45a90026947e@audleytravel.com?anonymous&ismsaljsauthenabled=true",
    destinations: ["costa-rica", "ecuador", "peru"],
    displayRegions: ["LATAM"],
    countriesDisplay: "Costa Rica, Ecuador, Peru",
  },
  {
    name: "Tyler Nilsson-Goodwin",
    title: "Turbo",
    calendarUrl: null,
    destinations: ["mexico", "peru", "ecuador", "colombia"],
    displayRegions: ["LATAM"],
    countriesDisplay: "Mexico, Peru, Ecuador, Colombia",
  },
  {
    name: "Jasmine Scott",
    title: "Senior",
    calendarUrl: null,
    destinations: ["costa-rica", "colombia", "ecuador", "peru", "panama"],
    displayRegions: ["LATAM"],
    countriesDisplay: "Costa Rica, Colombia, Ecuador, Peru, Panama",
  },

  // === CANADA ===
  {
    name: "Connor Chess",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/ConnorChess@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["canada-east", "canada-west", "usa-new-england", "australia", "new-zealand"],
    displayRegions: ["Canada", "USA"],
    countriesDisplay: "Canada, New England, Australia, New Zealand",
  },
  {
    name: "Jillian McVey",
    title: "Elite",
    calendarUrl: "https://outlook.office365.com/book/JillianMcVey@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["canada-east", "canada-west", "usa-new-england", "australia", "new-zealand"],
    displayRegions: ["Canada", "USA"],
    countriesDisplay: "Canada, New England, Australia, New Zealand",
  },
  {
    name: "Julia Criscuolo",
    title: "CS",
    calendarUrl: "https://outlook.office365.com/book/JuliaCriscuolo@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["canada-east", "canada-west", "australia", "new-zealand"],
    displayRegions: ["Canada"],
    countriesDisplay: "Canada, Australia, New Zealand",
  },
  {
    name: "Shea Spillane",
    title: "Elite",
    calendarUrl: "https://outlook.office365.com/book/SheaSpillanesAppointmentCalendar@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["canada-east", "canada-west", "australia", "new-zealand", "fiji"],
    displayRegions: ["Canada"],
    countriesDisplay: "Canada, Australia, New Zealand, Fiji",
  },

  // === USA-ONLY ===
  {
    name: "Matt Westgate",
    title: "",
    calendarUrl: "https://outlook.office365.com/book/MattWestgate@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["usa-hawaii", "usa-california"],
    displayRegions: ["USA"],
    countriesDisplay: "Hawaii, California",
  },
  {
    name: "Mikaela Wall",
    title: "",
    calendarUrl: "https://outlook.office.com/bookwithme/user/fc9779a278924a83ba4f36aee7193e71@audleytravel.com?anonymous&ismsaljsauthenabled=true",
    destinations: ["usa-hawaii", "usa-california"],
    displayRegions: ["USA"],
    countriesDisplay: "Hawaii, California",
  },
  {
    name: "David LaPointe",
    title: "",
    calendarUrl: "https://outlook.office365.com/book/DavidLaPointe@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["usa-new-england"],
    displayRegions: ["USA"],
    countriesDisplay: "New England",
  },
  {
    name: "Jessica Taylor",
    title: "",
    calendarUrl: "https://outlook.office365.com/book/JessicaTaylor1@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["usa-hawaii"],
    displayRegions: ["USA"],
    countriesDisplay: "Hawaii",
  },
  {
    name: "Mike Waxman",
    title: "",
    calendarUrl: "https://outlook.office365.com/book/MichaelWaxman@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["usa-national-parks"],
    displayRegions: ["USA"],
    countriesDisplay: "Southwest/Rockies",
  },
  {
    name: "Devin O'Doherty",
    title: "",
    calendarUrl: "https://outlook.office365.com/book/DevinODoherty@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["usa-national-parks"],
    displayRegions: ["USA"],
    countriesDisplay: "Southwest/Rockies",
  },
  {
    name: "Haley Chesna",
    title: "",
    calendarUrl: "https://outlook.office365.com/book/HaleyChesna@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["usa-national-parks"],
    displayRegions: ["USA"],
    countriesDisplay: "Southwest/Rockies",
  },

  // === ASIA ===
  {
    name: "Anupama",
    title: "Senior",
    calendarUrl: "https://outlook.office.com/bookwithme/user/ea83c073fdca414080df6cce448a58d6@audleytravel.com?anonymous&ep=signature",
    destinations: ["india", "sri-lanka", "nepal"],
    displayRegions: ["Asia"],
    countriesDisplay: "India, Sri Lanka, Nepal",
  },
  {
    name: "Jason",
    title: "Turbo",
    calendarUrl: null,
    destinations: ["india", "sri-lanka", "egypt"],
    displayRegions: ["Asia"],
    countriesDisplay: "India, Sri Lanka, Egypt",
  },
  {
    name: "Katarina DiPlacido",
    title: "CS",
    calendarUrl: "https://outlook.office365.com/owa/calendar/KatarinaDiPlacido@audleytravel.com/bookings/",
    destinations: ["india"],
    displayRegions: ["Asia"],
    countriesDisplay: "India",
  },
  {
    name: "Niall Causer",
    title: "Turbo",
    calendarUrl: "https://outlook.office365.com/owa/calendar/NiallCauser@audleytravel.com/bookings/",
    destinations: ["india", "sri-lanka"],
    displayRegions: ["Asia"],
    countriesDisplay: "India, Sri Lanka",
  },
  {
    name: "Zac Pardee",
    title: "Elite",
    calendarUrl: "https://outlook.office.com/bookwithme/user/3ff0d520e89c4f2ca665890944a788ad@audleytravel.com?anonymous&ep=pcard",
    destinations: ["india", "nepal", "uae"],
    displayRegions: ["Asia", "Middle East"],
    countriesDisplay: "India, Nepal, Dubai",
  },
  {
    name: "Joy Rhinehart",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/JoyRhinehartAudleyTravel@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["south-korea"],
    displayRegions: ["Asia"],
    countriesDisplay: "South Korea",
  },
  {
    name: "Stephanie Mailhot",
    title: "Senior",
    calendarUrl: "https://outlook.office.com/book/StephanieMailhot@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["south-korea"],
    displayRegions: ["Asia"],
    countriesDisplay: "South Korea",
  },
  {
    name: "Asha Benson",
    title: "Senior",
    calendarUrl: "https://outlook.office.com/book/AshaBenson@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["south-korea"],
    displayRegions: ["Asia"],
    countriesDisplay: "South Korea",
  },
  {
    name: "Adam Falk",
    title: "Elite",
    calendarUrl: "https://outlook.office.com/book/AdamFalk@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["uzbekistan", "kyrgyzstan", "china"],
    displayRegions: ["Asia"],
    countriesDisplay: "Uzbekistan, Kyrgyzstan, China",
  },
  {
    name: "Alex Starzynski",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/AlexStarzynski@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["south-korea"],
    displayRegions: ["Asia"],
    countriesDisplay: "South Korea",
  },
  {
    name: "Kristina Staples",
    title: "CS",
    calendarUrl: "https://outlook.office.com/bookwithme/user/23c55f66bd6d4c5b94555f2e445a725f@audleytravel.com?anonymous&ismsaljsauthenabled",
    destinations: ["china"],
    displayRegions: ["Asia"],
    countriesDisplay: "China",
  },
  {
    name: "Mackenzie McNeill",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/MackenzieMcNeill@audleytravel.com/",
    destinations: ["china"],
    displayRegions: ["Asia"],
    countriesDisplay: "China",
  },
  {
    name: "Stephanie Reddaway",
    title: "CS",
    calendarUrl: "https://outlook.office365.com/book/StephanieReddaway@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["china"],
    displayRegions: ["Asia"],
    countriesDisplay: "China",
  },

  // === MIDDLE EAST ===
  {
    name: "Kerry Ann Derwin",
    title: "Turbo",
    calendarUrl: "https://outlook.office365.com/book/KerryAnnDerwin@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["egypt", "israel", "jordan"],
    displayRegions: ["Middle East"],
    countriesDisplay: "Egypt, Israel, Jordan",
  },
  {
    name: "Kristen Ziino",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/KristenZiino@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["egypt"],
    displayRegions: ["Middle East"],
    countriesDisplay: "Egypt",
  },
  {
    name: "Juliana Wyman",
    title: "Senior",
    calendarUrl: "https://outlook.office.com/book/JulianaWyman@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["egypt", "jordan", "uae"],
    displayRegions: ["Middle East"],
    countriesDisplay: "Egypt, Jordan, Dubai",
  },
  {
    name: "Michaella ONeill",
    title: "CS",
    calendarUrl: "https://outlook.office.com/bookwithme/user/af12b817e6f2406dba4b6936df3e0a25@audleytravel.com?anonymous&ep=pcard",
    destinations: ["egypt"],
    displayRegions: ["Middle East"],
    countriesDisplay: "Egypt",
  },
  {
    name: "Liz Vedrani",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/LizVedrani@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["egypt", "morocco", "uae"],
    displayRegions: ["Middle East"],
    countriesDisplay: "Egypt, Morocco, Dubai",
  },
  {
    name: "Lauren Burrill",
    title: "Onboard",
    calendarUrl: "https://outlook.office.com/book/LaurenBurrill@audleytravel.com/?ismsaljsauthenabled",
    destinations: ["egypt", "morocco"],
    displayRegions: ["Middle East"],
    countriesDisplay: "Egypt, Morocco",
  },
  {
    name: "Adam Shahin",
    title: "Onboard",
    calendarUrl: "https://outlook.office365.com/book/AdamShahin1@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["egypt", "morocco"],
    displayRegions: ["Middle East"],
    countriesDisplay: "Egypt, Morocco",
  },
  {
    name: "Corinne Landry",
    title: "Turbo",
    calendarUrl: "https://outlook.office365.com/book/CorinneLandry2@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["morocco", "kenya", "tanzania"],
    displayRegions: ["Middle East", "Africa"],
    countriesDisplay: "Morocco, Kenya, Tanzania",
  },
  {
    name: "Claire O'Brien",
    title: "Senior",
    calendarUrl: "https://outlook.office365.com/book/ClaireOBrien@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["morocco"],
    displayRegions: ["Middle East"],
    countriesDisplay: "Morocco",
  },
  {
    name: "Lucy Celon",
    title: "CS",
    calendarUrl: "https://outlook.office365.com/book/LucyCelon@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["morocco"],
    displayRegions: ["Middle East"],
    countriesDisplay: "Morocco",
  },
  {
    name: "Emily Holman",
    title: "Onboard",
    calendarUrl: "https://outlook.office.com/bookwithme/user/0b74eb0bb0b442c4afd3c6e0c97708b7@audleytravel.com?anonymous&ismsaljsauthenabled",
    destinations: ["uae", "oman", "south-africa", "zambia"],
    displayRegions: ["Middle East", "Africa"],
    countriesDisplay: "Dubai, Oman, South Africa, Zambia",
  },

  // === AFRICA ===
  {
    name: "Laura Coughlin",
    title: "Turbo",
    calendarUrl: "https://outlook.office365.com/book/LauraCoughlin@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["tanzania", "kenya", "south-africa", "mauritius", "seychelles"],
    displayRegions: ["Africa"],
    countriesDisplay: "Tanzania, Kenya, South Africa, Mauritius, Seychelles",
  },
  {
    name: "Tom Wilkinson",
    title: "Turbo",
    calendarUrl: "https://outlook.office365.com/book/ThomasWilkinson@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["tanzania", "kenya", "rwanda", "uganda", "south-africa"],
    displayRegions: ["Africa"],
    countriesDisplay: "Tanzania, Kenya, Rwanda, Uganda, South Africa",
  },
  {
    name: "David Katwiwa",
    title: "Turbo",
    calendarUrl: "https://outlook.office365.com/book/DavidKatwiwa@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["kenya", "tanzania", "rwanda", "uganda"],
    displayRegions: ["Africa"],
    countriesDisplay: "Kenya, Tanzania, Rwanda, Uganda",
  },
  {
    name: "Ned Morgan",
    title: "Onboard",
    calendarUrl: "https://outlook.office.com/bookwithme/user/e2e9d6a1416b4b1a9470186e692c5e19@audleytravel.com?anonymous&ismsaljsauthenabled",
    destinations: ["kenya", "tanzania"],
    displayRegions: ["Africa"],
    countriesDisplay: "Kenya, Tanzania",
  },
  {
    name: "Thora Taylor",
    title: "Senior",
    calendarUrl: "https://outlook.office.com/bookwithme/user/fb5c5a03f0dd4bd4be4ea238a76744cd@audleytravel.com?anonymous&ismsaljsauthenabled=true",
    destinations: ["kenya", "tanzania", "south-africa", "zimbabwe"],
    displayRegions: ["Africa"],
    countriesDisplay: "Kenya, Tanzania, South Africa, Zimbabwe",
  },
  {
    name: "Jeremy Hyman",
    title: "Elite",
    calendarUrl: "https://outlook.office365.com/book/JeremyHyman@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["south-africa", "botswana", "madagascar"],
    displayRegions: ["Africa"],
    countriesDisplay: "South Africa, Botswana, Madagascar",
  },
  {
    name: "Sonia Chevli",
    title: "CS",
    calendarUrl: "https://outlook.office365.com/book/SoniaChevli@audleytravel.com/?ismsaljsauthenabled=true",
    destinations: ["south-africa"],
    displayRegions: ["Africa"],
    countriesDisplay: "South Africa",
  },

  // === TA-ASSIGNED AGENTS (no booking calendars) ===
  {
    name: "Chris Flad",
    title: "",
    calendarUrl: null,
    destinations: ["japan"],
    displayRegions: ["Asia"],
    countriesDisplay: "Japan",
  },
  {
    name: "Amy Rowland",
    title: "",
    calendarUrl: null,
    destinations: ["japan"],
    displayRegions: ["Asia"],
    countriesDisplay: "Japan",
  },
  {
    name: "Kai Gundersen",
    title: "",
    calendarUrl: null,
    destinations: ["japan"],
    displayRegions: ["Asia"],
    countriesDisplay: "Japan",
  },
  {
    name: "Gudrun",
    title: "",
    calendarUrl: null,
    destinations: ["italy", "switzerland"],
    displayRegions: ["Italy"],
    countriesDisplay: "Italy, Switzerland",
  },
  {
    name: "Anthony Vaglica",
    title: "",
    calendarUrl: null,
    destinations: ["australia", "new-zealand", "french-polynesia"],
    displayRegions: ["Australia & NZ"],
    countriesDisplay: "Australia, New Zealand, French Polynesia",
  },
  {
    name: "Jack Tydeman",
    title: "",
    calendarUrl: null,
    destinations: ["thailand", "indonesia"],
    displayRegions: ["Asia"],
    countriesDisplay: "Thailand, Indonesia",
  },
  {
    name: "Matt McLean",
    title: "",
    calendarUrl: null,
    destinations: ["thailand", "indonesia"],
    displayRegions: ["Asia"],
    countriesDisplay: "Thailand, Indonesia",
  },
  {
    name: "Zachary Vogel",
    title: "",
    calendarUrl: null,
    destinations: ["thailand", "indonesia"],
    displayRegions: ["Asia"],
    countriesDisplay: "Thailand, Indonesia",
  },
  {
    name: "Julia Matton",
    title: "",
    calendarUrl: null,
    destinations: ["thailand"],
    displayRegions: ["Asia"],
    countriesDisplay: "Thailand",
  },
  {
    name: "Sebastian Pieri",
    title: "",
    calendarUrl: null,
    destinations: ["switzerland", "france"],
    displayRegions: ["Europe"],
    countriesDisplay: "Switzerland, France",
  },
  {
    name: "Brianna Zirolli",
    title: "",
    calendarUrl: null,
    destinations: ["switzerland"],
    displayRegions: ["Europe"],
    countriesDisplay: "Switzerland",
  },
  {
    name: "Lily Cohen",
    title: "",
    calendarUrl: null,
    destinations: ["ireland", "scotland", "england"],
    displayRegions: ["UK & Ireland"],
    countriesDisplay: "Ireland, Scotland, England",
  },
  {
    name: "Heather Rufo",
    title: "",
    calendarUrl: null,
    destinations: ["ireland", "scotland", "england"],
    displayRegions: ["UK & Ireland"],
    countriesDisplay: "Ireland, Scotland, England",
  },
  {
    name: "Mareesa Ahmad",
    title: "",
    calendarUrl: null,
    destinations: ["ireland", "iceland", "scotland", "england"],
    displayRegions: ["UK & Ireland", "Scandinavia"],
    countriesDisplay: "Ireland, Iceland, Scotland, England",
  },
  {
    name: "Erika Jolie",
    title: "",
    calendarUrl: null,
    destinations: ["portugal", "spain"],
    displayRegions: ["Europe"],
    countriesDisplay: "Portugal, Spain",
  },
  {
    name: "Riley Casadei",
    title: "",
    calendarUrl: null,
    destinations: ["portugal", "spain"],
    displayRegions: ["Europe"],
    countriesDisplay: "Portugal, Spain",
  },
  {
    name: "Kelsey White",
    title: "",
    calendarUrl: null,
    destinations: ["iceland"],
    displayRegions: ["Scandinavia"],
    countriesDisplay: "Iceland",
  },
  {
    name: "Caroline Fahey",
    title: "",
    calendarUrl: null,
    destinations: ["france"],
    displayRegions: ["Europe"],
    countriesDisplay: "France",
  },
  {
    name: "Kelly Edwards",
    title: "",
    calendarUrl: null,
    destinations: ["france"],
    displayRegions: ["Europe"],
    countriesDisplay: "France",
  },
  {
    name: "Nataly Solis-Alva",
    title: "",
    calendarUrl: null,
    destinations: ["peru", "ecuador"],
    displayRegions: ["LATAM"],
    countriesDisplay: "Peru, Ecuador",
  },
];

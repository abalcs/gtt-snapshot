import { getDb } from "@/../db/database";
import { getCached, setCache, invalidateCache } from "./data-cache";

export interface SpecialistEntry {
  id?: string;
  interest: string;
  region: string;
  specialists: string[];
}

export const SPECIALIST_REGIONS = [
  "Africa",
  "Asia",
  "Australasia & Pacific",
  "Europe",
  "Latin America & Caribbean",
  "Middle East & North Africa",
  "UK & Ireland",
  "Iberia & Turkey",
  "USA & Canada",
] as const;

export const SPECIALIST_DATA: SpecialistEntry[] = [
  // --- Africa ---
  { interest: "Botswana", region: "Africa", specialists: ["Laura Coughlin", "Jeremy Hyman", "David Katwiwa"] },
  { interest: "Kenya", region: "Africa", specialists: ["David Katwiwa", "Tom Wilkinson", "Corinne Landry", "Laura Coughlin", "Ned Morgan", "Stephanie Rogers", "Thora Taylor"] },
  { interest: "Madagascar", region: "Africa", specialists: ["Jeremy Hyman"] },
  { interest: "Mauritius", region: "Africa", specialists: ["Laura Coughlin", "Tom Wilkinson (add-on only; no standalone)"] },
  { interest: "Malawi", region: "Africa", specialists: ["David Katwiwa"] },
  { interest: "Morocco", region: "Africa", specialists: ["Corinne Landry", "Kerry-Ann Derwin", "Liz Vedrani", "Lucy Celon", "Claire O'Brien", "Zac Pardee"] },
  { interest: "Mozambique", region: "Africa", specialists: ["Tom Wilkinson", "Laura Coughlin"] },
  { interest: "Namibia", region: "Africa", specialists: ["Laura Coughlin", "Tom Wilkinson"] },
  { interest: "Rwanda", region: "Africa", specialists: ["Tom Wilkinson", "David Katwiwa", "Laura Coughlin"] },
  { interest: "Seychelles", region: "Africa", specialists: ["Tom Wilkinson (trained)"] },
  { interest: "South Africa", region: "Africa", specialists: ["Michaella ONeill", "Chris Fleming", "David Katwiwa", "Tom Wilkinson", "Laura Coughlin", "Jeremy Hyman", "Sonia Chevli", "Thora Taylor", "Emily Holman"] },
  { interest: "Tanzania", region: "Africa", specialists: ["David Katwiwa", "Tom Wilkinson", "Corinne Landry", "Laura Coughlin", "Ned Morgan", "Stephanie Rogers", "Thora Taylor"] },
  { interest: "Uganda", region: "Africa", specialists: ["Tom Wilkinson", "David Katwiwa"] },
  { interest: "Zambia", region: "Africa", specialists: ["Jeremy Hyman", "David Katwiwa", "Tom Wilkinson", "Emily Holman"] },
  { interest: "Zimbabwe", region: "Africa", specialists: ["David Katwiwa", "Tom Wilkinson", "Thora Taylor"] },

  // --- Asia ---
  { interest: "Bhutan", region: "Asia", specialists: ["Jason Toms", "Niall Causer", "Hannah Davidson", "Anupama Umakanth", "Zac Pardee"] },
  { interest: "Borneo", region: "Asia", specialists: ["Jack Tydeman", "Alix Macaluso", "Claire McHugh", "Julia Matton"] },
  { interest: "Burma (Myanmar)", region: "Asia", specialists: ["Jack Tydeman", "Matthew Mclean"] },
  { interest: "Cambodia", region: "Asia", specialists: ["Jack Tydeman", "Matthew Mclean", "Natasha Khan", "Rachel Forbes", "Alex Starzynski"] },
  { interest: "China", region: "Asia", specialists: ["Adam Falk", "Anupama Umakanth", "Kristina Staples", "Mackenzie McNeill", "Stephanie Reddaway", "Taipei Stop Over Only: Jack Tydeman, Tam Frederick, Tesia Smith as well as all China sellers"] },
  { interest: "Indonesia", region: "Asia", specialists: ["Jack Tydeman", "Matthew Mclean", "Alix Macaluso", "Natasha Khan", "Zach Vogel", "Cris Martinez (starting in Dec)", "Chris Flad"] },
  { interest: "Japan", region: "Asia", specialists: ["Tamatha Frederick", "Asha Benson", "Adam Falk", "Niall Causer", "Nelson Diaz", "Stephanie Mailhot", "Joy Rhineheart", "Lauren Saucier", "Stephanie Reddaway", "Hannah Davidson", "Kristina Staples", "Amy Rowland", "Chris Flad", "Mackenzie McNeill", "Tesia Batts", "Rachel Adams", "Kai Gundersen", "Jennifer Hrycyszyn", "Julia Prajsnar", "Iman Fenina"] },
  { interest: "Laos", region: "Asia", specialists: ["Jack Tydeman", "Natasha Khan", "Rachel Forbes", "Alex Starzynski"] },
  { interest: "Malaysia (Peninsular)", region: "Asia", specialists: ["Jack Tydeman", "Natasha Khan"] },
  { interest: "Maldives", region: "Asia", specialists: ["Jason Toms", "Matt McLean", "Niall Causer", "Tesia Batts", "Claire McHugh", "Zac Pardee", "Alix Macaluso", "Kat DiPlacido", "Anupama Umakanth"] },
  { interest: "Nepal", region: "Asia", specialists: ["Jason Toms", "Niall Causer", "Hannah Davidson (Kathmandu Valley only)", "Zac Pardee", "Anupama Umakanth"] },
  { interest: "Southern India", region: "Asia", specialists: ["Niall Causer", "Anupama Umakanth", "Zac Pardee", "Jason Toms", "Katarina DiPlacido"] },
  { interest: "Northern India / Rajasthan", region: "Asia", specialists: ["Niall Causer", "Jason Toms", "Anupama Umakanth", "Nelson Diaz", "Katarina DiPlacido", "Zac Pardee"] },
  { interest: "Philippines", region: "Asia", specialists: ["Hannah Davidson", "Meghan Berger"] },
  { interest: "Russia", region: "Asia", specialists: ["Jason Toms"] },
  { interest: "Singapore", region: "Asia", specialists: ["Any Asia Specialist"] },
  { interest: "South Korea", region: "Asia", specialists: ["Joy Rhineheart", "Steph Mailhot", "Asha Benson", "Nelson Diaz (Seoul Stop Over Only)", "Jack Tydeman", "Alex Starzynski"] },
  { interest: "Central Asia (Uzbekistan & Kyrgyzstan)", region: "Asia", specialists: ["Adam Falk", "Asha Benson"] },
  { interest: "Sri Lanka", region: "Asia", specialists: ["Niall Causer", "Jason Toms", "Zac Pardee"] },
  { interest: "Thailand", region: "Asia", specialists: ["Jack Tydeman", "Matthew Mclean", "Natasha Khan", "Claire McHugh", "Rachel Forbes", "Julia Matton", "Alex Starzynski", "Meghan Berger", "Lauren Saucier", "Tesia Batts", "Zach Vogel", "Cris Martinez (starting in Dec)"] },
  { interest: "Vietnam", region: "Asia", specialists: ["Jack Tydeman", "Matthew Mclean", "Natasha Khan", "Claire McHugh", "Rachel Forbes", "Julia Matton", "Alex Starzynski", "Meghan Berger", "Lauren Saucier", "Zach Vogel", "Alix Macaluso"] },
  { interest: "Wildlife India", region: "Asia", specialists: ["Zac Pardee"] },

  // --- Australasia & Pacific ---
  { interest: "Australia", region: "Australasia & Pacific", specialists: ["Ann Krantz", "Anthony Vaglica", "Connor Chess", "Crystal Munier", "David LaPointe", "Desiree Baker", "Devin O'Doherty", "Emily Geary", "Haley Chesna", "Jessica Taylor", "Jillian McVey", "Julia Criscuolo", "Keila McCabe", "Matt Westgate", "Michaela Hayes", "Mikaela Wall", "Shea Spillane", "Talia Bierschwale"] },
  { interest: "Cook Islands", region: "Australasia & Pacific", specialists: ["Haley Chesna", "Jessica Taylor", "Mikaela Wall", "Shea Spillane"] },
  { interest: "Fiji", region: "Australasia & Pacific", specialists: ["Anthony Vaglica", "Devin O'Doherty", "Emily Geary", "Haley Chesna", "Jessica Taylor", "Mikaela Wall"] },
  { interest: "French Polynesia", region: "Australasia & Pacific", specialists: ["Anthony Vaglica", "Connor Chess", "Emily Geary", "Haley Chesna", "Jessica Taylor", "Jillian McVey", "Matt Westgate", "Mikaela Wall", "Shea Spillane"] },
  { interest: "New Zealand", region: "Australasia & Pacific", specialists: ["Anthony Vaglica", "Aoibheann Murphy", "Connor Chess", "David LaPointe", "Desiree Baker", "Devin O'Doherty", "Emily Geary", "Haley Chesna", "Jessica Taylor", "Jillian McVey", "Julia Criscuolo", "Keila McCabe", "Matt Westgate", "Michaela Hayes", "Mikaela Wall", "Shea Spillane"] },
  { interest: "Samoa", region: "Australasia & Pacific", specialists: ["Anthony Vaglica", "Devin O'Doherty", "Emily Geary", "Jessica Taylor", "Mikaela Wall"] },

  // --- Europe ---
  { interest: "Austria", region: "Europe", specialists: ["Taylor Mawn", "Jeff Procopio", "Lynn Macaluso", "Mary McCormack", "Andria Channels"] },
  { interest: "Budapest", region: "Europe", specialists: ["Taylor Mawn", "Jeff Procopio", "Lynn Macaluso", "Mary McCormack", "Andria Channels"] },
  { interest: "Slovenia / Montenegro / Bosnia", region: "Europe", specialists: ["Amanda Brown", "Samantha Rubin", "Lynn Macaluso"] },
  { interest: "Croatia", region: "Europe", specialists: ["Amanda Brown", "Samantha Rubin", "Lynn Macaluso"] },
  { interest: "European River Cruising", region: "Europe", specialists: ["Taylor Mawn", "Caroline Fahey", "Kelly Edwards", "Madeline Dalton", "Lisa Finnegan", "Samantha Sutherland", "Laura Plansky", "Sebastian Pieri", "Kelsey White"] },
  { interest: "France", region: "Europe", specialists: ["Caroline Fahey", "Kelly Edwards", "Laura Castro", "Madeline Dalton", "Lisa Finnegan", "Samantha Sutherland", "Laura Plansky", "Sebastian Pieri", "Kelsey White (overflow)"] },
  { interest: "Germany", region: "Europe", specialists: ["Taylor Mawn", "Lynn Macaluso", "Andria Channels", "Mary McCormack"] },
  { interest: "Greece", region: "Europe", specialists: ["Jeff Procopio", "Laura Plansky", "Jasmine Morrill", "Matt Greenbaum", "Amanda Brown", "Eric Carnes (Overflow)", "Brianna Zirolli", "Samantha Rubin", "Tess Creatura"] },
  { interest: "Italy", region: "Europe", specialists: ["Alix Macaluso (Overflow)", "Amanda Brown", "Andria Channels", "Brianna Zirolli", "Carly Ristuccia", "Jasmine Morrill", "Gudrun Updegraff", "Jeffrey Procopio", "Jenna Cunniff", "Kelly Edwards", "Laura Castro", "Laura Plansky", "Lauren Middleton", "Lynn Macaluso", "Madeline Dalton", "Mary McCormack", "Margaret O'Connell", "Matt Greenbaum", "Rebecca Mechura", "Roberto Sancho", "Sage Watterson", "Samantha Rubin", "Sarah Quigley", "Samantha Sutherland", "Taylor Mawn"] },
  { interest: "Prague", region: "Europe", specialists: ["Taylor Mawn", "Jeff Procopio", "Lynn Macaluso", "Mary McCormack", "Andria Channels"] },
  { interest: "Belgium", region: "Europe", specialists: ["Lisa Finnegan", "Sam Sutherland", "Taylor Mawn", "Madeline Dalton"] },
  { interest: "Benelux", region: "Europe", specialists: ["Taylor Mawn", "Samantha Sutherland", "Lisa Finnegan", "Madeline Dalton"] },
  { interest: "Luxembourg", region: "Europe", specialists: ["Taylor Mawn", "Samantha Sutherland", "Lisa Finnegan", "Madeline Dalton"] },
  { interest: "Netherlands", region: "Europe", specialists: ["Taylor Mawn", "Samantha Sutherland", "Lisa Finnegan", "Madeline Dalton"] },
  { interest: "Switzerland", region: "Europe", specialists: ["Brianna Zirolli", "Jeff Procopio", "Samantha Sutherland", "Gudrun Updegraff", "Sage Watterson", "Sebastian Pieri", "Caroline Fahey", "Aislyn Emerson"] },
  { interest: "Norway", region: "Europe", specialists: ["Aislyn Emerson", "Julia Mole"] },
  { interest: "Sweden", region: "Europe", specialists: ["Aislyn Emerson", "Julia Mole"] },
  { interest: "Denmark", region: "Europe", specialists: ["Aislyn Emerson", "Julia Mole"] },
  { interest: "Scandinavia", region: "Europe", specialists: ["Aislyn Emerson", "Julia Mole"] },

  // --- Latin America & Caribbean ---
  { interest: "Antarctica", region: "Latin America & Caribbean", specialists: ["Emma Gailey", "Tam Frederick"] },
  { interest: "Arctic", region: "Latin America & Caribbean", specialists: ["Emma Gailey", "Piper Eskridge", "Ryan Moncton", "Tam Frederick"] },
  { interest: "Argentina", region: "Latin America & Caribbean", specialists: ["Emma Gailey", "Ana Baratta da Costa", "Piper Eskridge", "Sydney Jones (MAT)", "Tamatha Frederick"] },
  { interest: "Belize", region: "Latin America & Caribbean", specialists: ["Eileen Dinn", "Emma Gailey", "Meghan Bergstrom"] },
  { interest: "Bolivia", region: "Latin America & Caribbean", specialists: ["Ana Baratta Da Costa", "Jasmine Scott", "Mike Waxman"] },
  { interest: "Brazil", region: "Latin America & Caribbean", specialists: ["Ana Baratta Da Costa", "Meghan Bergstrom"] },
  { interest: "Caribbean", region: "Latin America & Caribbean", specialists: ["Emma Gailey"] },
  { interest: "Chile", region: "Latin America & Caribbean", specialists: ["Ana Baratta Da Costa", "Emma Gailey", "Piper Eskridge", "Sydney Jones (MAT)", "Tamatha Frederick"] },
  { interest: "Colombia", region: "Latin America & Caribbean", specialists: ["Jasmine Scott", "Tyler Nilsson Goodwin", "Tam Frederick"] },
  { interest: "Costa Rica", region: "Latin America & Caribbean", specialists: ["Eileen Dinn", "Emma Gailey", "Jasmine Scott", "Piper Eskridge", "Robyn Lipkowitz", "Spencer Kulis"] },
  { interest: "Ecuador", region: "Latin America & Caribbean", specialists: ["Eileen Dinn", "Jasmine Scott", "Mike Waxman", "Nataly Solis-Alva", "Robyn Lipkowitz", "Ryan Moncton", "Spencer Kulis", "Tyler Nilsson Goodwin"] },
  { interest: "Guatemala", region: "Latin America & Caribbean", specialists: ["Eileen Dinn", "Meghan Bergstrom"] },
  { interest: "Panama", region: "Latin America & Caribbean", specialists: ["Emma Gailey", "Jasmine Scott"] },
  { interest: "Mexico", region: "Latin America & Caribbean", specialists: ["Meghan Bergstrom", "Tyler Nilsson Goodwin"] },
  { interest: "Peru", region: "Latin America & Caribbean", specialists: ["Ana Baratta da Costa", "Jasmine Scott", "Mike Waxman", "Nataly Solis-Alva", "Robyn Lipkowitz (on leave)", "Ryan Moncton", "Tyler Nilsson-Goodwin"] },
  { interest: "Uruguay", region: "Latin America & Caribbean", specialists: ["Sydney Jones (MAT LEAVE)", "Emma Gailey"] },

  // --- Middle East & North Africa ---
  { interest: "Dubai", region: "Middle East & North Africa", specialists: ["Emily Holman", "Kerry-Ann Derwin", "Liz Vedrani"] },
  { interest: "Egypt", region: "Middle East & North Africa", specialists: ["Claire OBrien", "Erika Jolie", "Liz Vedrani", "Kristen Ziino", "Jason Toms", "Adam Shahin", "Lauren Burrill", "Zac Pardee", "Michaella ONeill", "Kelsey White", "Riley Casadei"] },

  // --- UK & Ireland ---
  { interest: "England", region: "UK & Ireland", specialists: ["Caroline Fahey", "Lily Cohen", "Kyle Destefano", "Melissa Kowalinski", "Mareesa Ahmad", "Madeline Kauffman", "Jeff O'Connor", "Heather Rufo", "RSM: Jacqueline Balamas"] },
  { interest: "Wales", region: "UK & Ireland", specialists: ["Caroline Fahey", "Lily Cohen", "Kyle Destefano", "Melissa Kowalinski", "Mareesa Ahmad", "Madeline Kauffman", "Jeff O'Connor", "Heather Rufo", "RSM: Jacqueline Balamas"] },
  { interest: "Iceland", region: "UK & Ireland", specialists: ["Julia Mole", "Kelsey White", "Mareesa Ahmad", "Liz Vedrani", "Melissa Kowalinski"] },
  { interest: "Ireland", region: "UK & Ireland", specialists: ["Caroline Fahey", "Lily Cohen", "Kyle Destefano", "Melissa Kowalinski", "Mareesa Ahmad", "Madeline Kauffman", "Jeff O'Connor", "Heather Rufo", "RSM: Jacqueline Balamas"] },
  { interest: "Scotland", region: "UK & Ireland", specialists: ["Caroline Fahey", "Lily Cohen", "Kyle Destefano", "Melissa Kowalinski", "Mareesa Ahmad", "Madeline Kauffman", "Jeff O'Connor", "Heather Rufo", "RSM: Jacqueline Balamas"] },

  // --- Iberia & Turkey ---
  { interest: "Portugal", region: "Iberia & Turkey", specialists: ["Bruce Entelisano (No Madeira)", "Frank Pergola (No Madeira)", "Corinne Landry (can sell Azores)", "Claire O'Brien", "Eric Carnes", "Kristen Ziino (can sell Azores)", "Lucy Celon", "Erika Jolie", "Riley Casadei (can sell Azores)", "Kelsey White", "Kendra Hay (can sell Azores)"] },
  { interest: "Spain", region: "Iberia & Turkey", specialists: ["Bruce Entelisano", "Corinne Landry", "Claire O'Brien", "Eric Carnes", "Kristen Ziino", "Lucy Celon", "Erika Jolie", "Riley Casadei", "Kelsey White", "Kendra Hay", "Frank Pergola"] },
  { interest: "Turkey", region: "Iberia & Turkey", specialists: ["Gudrun Updegraff", "Laura Plansky", "Kerry Ann Derwin"] },

  // --- Israel & Jordan & Oman ---
  { interest: "Israel", region: "Middle East & North Africa", specialists: ["Kerry-Ann Derwin"] },
  { interest: "Jordan", region: "Middle East & North Africa", specialists: ["Kerry-Ann Derwin", "Kristen Ziino", "Adam Shahin", "Riley Casadei", "Kelsey White", "Liz Vedrani"] },
  { interest: "Oman", region: "Middle East & North Africa", specialists: ["Emily Holman", "Kerry-Ann Derwin", "Kristen Ziino", "Adam Shahin", "Zac Pardee"] },

  // --- USA & Canada ---
  { interest: "California", region: "USA & Canada", specialists: ["Matt Westgate", "Mikaela Wall"] },
  { interest: "Alaska", region: "USA & Canada", specialists: ["Connor Schrempf (overflow)", "Meghan Bergstrom", "Piper Eskridge"] },
  { interest: "Southwest & Rockies", region: "USA & Canada", specialists: ["Mike Waxman", "Sydney Jones", "Devin O'Doherty", "Haley Chesna"] },
  { interest: "Deep South", region: "USA & Canada", specialists: ["(None currently)"] },
  { interest: "New England", region: "USA & Canada", specialists: ["Connor Chess", "Jillian McVey", "David LaPointe"] },
  { interest: "Hawaii", region: "USA & Canada", specialists: ["Jessica Taylor", "Matt Westgate", "Mikaela Wall", "Piper Eskridge"] },
  { interest: "Pacific Northwest", region: "USA & Canada", specialists: ["(None currently)"] },
  { interest: "Canada", region: "USA & Canada", specialists: ["Connor Chess", "Jillian McVey", "Julia Criscuolo", "Meghan Bergstrom", "Piper Eskridge", "Shea Spillane"] },
];

// ── Firestore-backed specialist data ─────────────────────

const COLLECTION = "specialist-assignments";

function slugifyInterest(interest: string): string {
  return interest.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Get all specialist entries from Firestore, falling back to hardcoded data */
export async function getSpecialistEntries(): Promise<SpecialistEntry[]> {
  const cached = getCached<SpecialistEntry[]>("specialists:all");
  if (cached) return cached;

  const snap = await getDb().collection(COLLECTION).get();

  if (snap.empty) {
    // No Firestore data yet — return hardcoded
    return setCache("specialists:all", SPECIALIST_DATA);
  }

  const entries: SpecialistEntry[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      interest: (data.interest as string) || doc.id,
      region: (data.region as string) || "",
      specialists: (data.specialists as string[]) || [],
    };
  });

  entries.sort((a, b) => {
    const regionCmp = a.region.localeCompare(b.region);
    if (regionCmp !== 0) return regionCmp;
    return a.interest.localeCompare(b.interest);
  });

  return setCache("specialists:all", entries);
}

/** Seed Firestore with hardcoded data (one-time migration) */
export async function seedSpecialistData(): Promise<number> {
  const db = getDb();
  const batch = db.batch();

  for (const entry of SPECIALIST_DATA) {
    const id = slugifyInterest(entry.interest);
    batch.set(db.collection(COLLECTION).doc(id), {
      interest: entry.interest,
      region: entry.region,
      specialists: entry.specialists,
    });
  }

  await batch.commit();
  invalidateCache("specialists:all");
  return SPECIALIST_DATA.length;
}

/** Update a single specialist entry */
export async function updateSpecialistEntry(id: string, specialists: string[]): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    specialists,
  });
  invalidateCache("specialists:all");
}

export { slugifyInterest };

import { getDb } from '../../db/database';
import { generateSearchTokens, generateSnippet } from './search-utils';
import type {
  Region,
  RegionWithCount,
  Destination,
  DestinationWithRegion,
  DestinationDetail,
  SpecialSection,
  SearchResult,
  AdminLogEntry,
} from './types';

const db = () => getDb();

// ── Helpers ─────────────────────────────────────────────

function docToRegion(id: string, data: FirebaseFirestore.DocumentData): Region {
  return {
    id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    sort_order: data.sort_order ?? 0,
  };
}

function docToDestination(id: string, data: FirebaseFirestore.DocumentData): Destination {
  return {
    id,
    region_id: data.region_slug,
    region_name: data.region_name ?? '',
    region_slug: data.region_slug ?? '',
    name: data.name,
    slug: data.slug,
    night_min: data.night_min ?? null,
    key_facts: data.key_facts ?? null,
    urgency: data.urgency ?? null,
    solo_pricing: data.solo_pricing ?? null,
    pax_limit: data.pax_limit ?? null,
    accommodations: data.accommodations ?? null,
    how_to_feature: data.how_to_feature ?? null,
    pair_with: data.pair_with ?? null,
    general_notes_1: data.general_notes_1 ?? null,
    general_notes_2: data.general_notes_2 ?? null,
    client_types_good: data.client_types_good ?? null,
    client_types_okay: data.client_types_okay ?? null,
    client_types_bad: data.client_types_bad ?? null,
    seasonality: data.seasonality ?? null,
    status: data.status ?? 'active',
    date_updated: data.date_updated ?? null,
    updated_by: data.updated_by ?? null,
    cs_rsm_source: data.cs_rsm_source ?? null,
    summary_of_changes: data.summary_of_changes ?? null,
    created_at: data.created_at ?? '',
    updated_at: data.updated_at ?? '',
    search_tokens: data.search_tokens ?? [],
    pricing_tiers: data.pricing_tiers ?? [],
    tags: data.tags ?? [],
  };
}

function docToSpecialSection(id: string, data: FirebaseFirestore.DocumentData): SpecialSection {
  return {
    id,
    title: data.title,
    slug: data.slug,
    content: data.content,
    region_scope: data.region_scope ?? null,
  };
}

// ── Regions ──────────────────────────────────────────────

export async function getAllRegions(): Promise<RegionWithCount[]> {
  const [regionsSnap, destsSnap] = await Promise.all([
    db().collection('regions').orderBy('sort_order').get(),
    db().collection('destinations').where('status', '==', 'active').get(),
  ]);

  // Count destinations per region
  const countMap = new Map<string, number>();
  for (const doc of destsSnap.docs) {
    const regionSlug = doc.data().region_slug as string;
    countMap.set(regionSlug, (countMap.get(regionSlug) ?? 0) + 1);
  }

  return regionsSnap.docs.map(doc => {
    const region = docToRegion(doc.id, doc.data());
    return { ...region, destination_count: countMap.get(region.slug) ?? 0 };
  });
}

export async function getRegionBySlug(slug: string): Promise<Region | undefined> {
  const doc = await db().collection('regions').doc(slug).get();
  if (!doc.exists) return undefined;
  return docToRegion(doc.id, doc.data()!);
}

// ── Destinations ─────────────────────────────────────────

export async function getAllDestinations(): Promise<DestinationWithRegion[]> {
  const snap = await db().collection('destinations')
    .where('status', '==', 'active')
    .get();

  const destinations = snap.docs.map(doc => docToDestination(doc.id, doc.data()));
  // Sort by region_name then name (Firestore can't order by two fields without composite index easily)
  destinations.sort((a, b) => {
    const regionCmp = (a.region_name || '').localeCompare(b.region_name || '');
    if (regionCmp !== 0) return regionCmp;
    return a.name.localeCompare(b.name);
  });
  return destinations;
}

export async function getDestinationsByRegion(regionSlug: string): Promise<DestinationWithRegion[]> {
  const snap = await db().collection('destinations')
    .where('region_slug', '==', regionSlug)
    .where('status', '==', 'active')
    .get();

  const destinations = snap.docs.map(doc => docToDestination(doc.id, doc.data()));
  destinations.sort((a, b) => a.name.localeCompare(b.name));
  return destinations;
}

export async function getDestinationBySlug(slug: string): Promise<DestinationDetail | undefined> {
  const doc = await db().collection('destinations').doc(slug).get();
  if (!doc.exists) return undefined;
  return docToDestination(doc.id, doc.data()!);
}

export async function getDestinationById(id: string): Promise<DestinationDetail | undefined> {
  // In Firestore, id IS the slug
  return getDestinationBySlug(id);
}

// ── Special Sections ─────────────────────────────────────

export async function getAllSpecialSections(): Promise<SpecialSection[]> {
  const snap = await db().collection('special_sections').get();
  const sections = snap.docs.map(doc => docToSpecialSection(doc.id, doc.data()));
  sections.sort((a, b) => a.title.localeCompare(b.title));
  return sections;
}

export async function getSpecialSectionBySlug(slug: string): Promise<SpecialSection | undefined> {
  const doc = await db().collection('special_sections').doc(slug).get();
  if (!doc.exists) return undefined;
  return docToSpecialSection(doc.id, doc.data()!);
}

// ── Search ───────────────────────────────────────────────

export async function searchDestinations(query: string, limit = 20): Promise<SearchResult[]> {
  const sanitized = query.replace(/[^\w\s-]/g, '').trim().toLowerCase();
  if (!sanitized) return [];

  const queryWords = sanitized.split(/\s+/).filter(Boolean);

  // Fetch all active destinations and filter in memory (~150 docs)
  const snap = await db().collection('destinations')
    .where('status', '==', 'active')
    .get();

  const results: SearchResult[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const tokens: string[] = data.search_tokens ?? [];
    // Check if all query words match at least one token (prefix match)
    const allMatch = queryWords.every(qw =>
      tokens.some(t => t.startsWith(qw))
    );
    if (!allMatch) continue;

    const dest = docToDestination(doc.id, data);
    results.push({
      id: doc.id,
      name: dest.name,
      slug: dest.slug,
      region_name: dest.region_name,
      region_slug: dest.region_slug,
      snippet: generateSnippet(dest, query),
      rank: 0,
    });
    if (results.length >= limit) break;
  }

  return results;
}

export async function searchSpecialSections(query: string): Promise<SpecialSection[]> {
  const sanitized = query.replace(/[^\w\s-]/g, '').trim().toLowerCase();
  if (!sanitized) return [];

  const snap = await db().collection('special_sections').get();
  return snap.docs
    .map(doc => docToSpecialSection(doc.id, doc.data()))
    .filter(s =>
      s.title.toLowerCase().includes(sanitized) ||
      s.content.toLowerCase().includes(sanitized)
    );
}

// ── Stats ────────────────────────────────────────────────

export async function getStats(): Promise<{ totalDestinations: number; totalRegions: number; activeDestinations: number }> {
  const [destsSnap, regionsSnap] = await Promise.all([
    db().collection('destinations').get(),
    db().collection('regions').get(),
  ]);

  let active = 0;
  for (const doc of destsSnap.docs) {
    if (doc.data().status === 'active') active++;
  }

  return {
    totalDestinations: destsSnap.size,
    totalRegions: regionsSnap.size,
    activeDestinations: active,
  };
}

// ── Admin Logging ────────────────────────────────────────

async function logAdminAction(entry: Omit<AdminLogEntry, 'id'>) {
  await db().collection('admin_logs').add(entry);
}

export async function getAdminLogs(limit = 50): Promise<AdminLogEntry[]> {
  const snap = await db().collection('admin_logs')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as AdminLogEntry[];
}

// ── Admin CRUD ───────────────────────────────────────────

export async function createDestination(data: Partial<Destination> & { region_id: string; name: string; slug: string }): Promise<string> {
  // Look up region info
  const regionDoc = await db().collection('regions').doc(data.region_id).get();
  const regionData = regionDoc.exists ? regionDoc.data()! : { name: data.region_id, slug: data.region_id };

  const now = new Date().toISOString();
  const destData: Record<string, unknown> = {
    name: data.name,
    slug: data.slug,
    region_name: regionData.name,
    region_slug: regionData.slug ?? data.region_id,
    night_min: data.night_min ?? null,
    key_facts: data.key_facts ?? null,
    urgency: data.urgency ?? null,
    solo_pricing: data.solo_pricing ?? null,
    pax_limit: data.pax_limit ?? null,
    accommodations: data.accommodations ?? null,
    how_to_feature: data.how_to_feature ?? null,
    pair_with: data.pair_with ?? null,
    general_notes_1: data.general_notes_1 ?? null,
    general_notes_2: data.general_notes_2 ?? null,
    client_types_good: data.client_types_good ?? null,
    client_types_okay: data.client_types_okay ?? null,
    client_types_bad: data.client_types_bad ?? null,
    seasonality: data.seasonality ?? null,
    status: data.status ?? 'active',
    date_updated: now,
    updated_by: data.updated_by ?? null,
    cs_rsm_source: data.cs_rsm_source ?? null,
    summary_of_changes: data.summary_of_changes ?? null,
    created_at: now,
    updated_at: now,
    pricing_tiers: data.pricing_tiers ?? [],
    tags: data.tags ?? [],
    search_tokens: generateSearchTokens({
      ...data,
      region_name: regionData.name as string,
    }),
  };

  await db().collection('destinations').doc(data.slug).set(destData);

  await logAdminAction({
    action: 'created',
    target_name: data.name,
    target_slug: data.slug,
    updated_by: (data.updated_by as string) || 'Unknown',
    changes: [
      { field: 'region', to: regionData.name as string },
      { field: 'status', to: (data.status as string) || 'active' },
    ],
    timestamp: now,
  });

  return data.slug;
}

export async function updateDestination(id: string, data: Partial<Destination>): Promise<void> {
  const updateData: Record<string, unknown> = {};
  const fields = Object.entries(data).filter(([key]) => key !== 'id' && key !== 'created_at');

  // Fetch existing doc for change tracking and token regeneration
  const existing = await db().collection('destinations').doc(id).get();
  const existingData = existing.data() || {};

  for (const [key, value] of fields) {
    updateData[key] = value ?? null;
  }
  const now = new Date().toISOString();
  const readableDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  updateData.updated_at = now;
  updateData.date_updated = readableDate;

  // If searchable fields changed, regenerate tokens
  const searchableFields = ['name', 'key_facts', 'urgency', 'accommodations', 'client_types_good', 'client_types_okay', 'client_types_bad', 'general_notes_1', 'general_notes_2', 'pair_with', 'region_name'];
  if (fields.some(([key]) => searchableFields.includes(key))) {
    const merged = { ...existingData, ...data };
    updateData.search_tokens = generateSearchTokens(merged as Partial<Destination>);
  }

  await db().collection('destinations').doc(id).update(updateData);

  // Build change list for logging
  const skipFields = ['updated_at', 'search_tokens', 'pricing_tiers', 'tags'];
  const changes: { field: string; from?: string; to?: string }[] = [];
  for (const [key, value] of fields) {
    if (skipFields.includes(key)) continue;
    const oldVal = existingData[key];
    const newVal = value ?? null;
    const oldStr = oldVal != null ? String(oldVal) : '';
    const newStr = newVal != null ? String(newVal) : '';
    if (oldStr !== newStr) {
      changes.push({
        field: key,
        from: oldStr || undefined,
        to: newStr || undefined,
      });
    }
  }

  if (changes.length > 0) {
    await logAdminAction({
      action: 'updated',
      target_name: (data.name as string) || existingData.name || id,
      target_slug: id,
      updated_by: (data.updated_by as string) || existingData.updated_by || 'Unknown',
      changes,
      timestamp: now,
    });
  }
}

export async function deleteDestination(id: string): Promise<void> {
  const existing = await db().collection('destinations').doc(id).get();
  const existingData = existing.data();

  await db().collection('destinations').doc(id).delete();

  await logAdminAction({
    action: 'deleted',
    target_name: existingData?.name || id,
    target_slug: id,
    updated_by: existingData?.updated_by || 'Unknown',
    changes: [],
    timestamp: new Date().toISOString(),
  });
}

export async function upsertPricingTiers(destinationId: string, tiers: { tier_label: string; price_per_week?: string | null; price_per_day?: string | null; notes?: string | null; sort_order?: number }[]): Promise<void> {
  const formattedTiers = tiers.map((t, i) => ({
    tier_label: t.tier_label,
    price_per_week: t.price_per_week ?? null,
    price_per_day: t.price_per_day ?? null,
    notes: t.notes ?? null,
    sort_order: t.sort_order ?? i,
  }));
  await db().collection('destinations').doc(destinationId).update({
    pricing_tiers: formattedTiers,
    updated_at: new Date().toISOString(),
  });
}

// ── Tag-based Filtering ─────────────────────────────────

export async function getDestinationsByTags(tagSlugs: string[], regionSlug?: string): Promise<DestinationWithRegion[]> {
  if (tagSlugs.length === 0) return [];

  const snap = await db().collection('destinations')
    .where('status', '==', 'active')
    .get();

  const results: DestinationWithRegion[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    if (regionSlug && data.region_slug !== regionSlug) continue;
    const destTags: string[] = data.tags ?? [];
    const allMatch = tagSlugs.every(slug => destTags.includes(slug));
    if (!allMatch) continue;
    results.push(docToDestination(doc.id, data));
  }

  results.sort((a, b) => {
    const regionCmp = (a.region_name || '').localeCompare(b.region_name || '');
    if (regionCmp !== 0) return regionCmp;
    return a.name.localeCompare(b.name);
  });

  return results;
}

// ── Sidebar Data ─────────────────────────────────────────

export async function getSidebarData(): Promise<{ regions: (Region & { destinations: { name: string; slug: string }[] })[]; specialSections: { title: string; slug: string }[] }> {
  const [regionsSnap, destsSnap, specialSnap] = await Promise.all([
    db().collection('regions').orderBy('sort_order').get(),
    db().collection('destinations').where('status', '==', 'active').get(),
    db().collection('special_sections').get(),
  ]);

  const regions = regionsSnap.docs.map(doc => docToRegion(doc.id, doc.data()));

  const destsByRegion = new Map<string, { name: string; slug: string }[]>();
  for (const doc of destsSnap.docs) {
    const d = doc.data();
    const regionSlug = d.region_slug as string;
    if (!destsByRegion.has(regionSlug)) destsByRegion.set(regionSlug, []);
    destsByRegion.get(regionSlug)!.push({ name: d.name, slug: d.slug });
  }

  // Sort destinations within each region
  for (const dests of destsByRegion.values()) {
    dests.sort((a, b) => a.name.localeCompare(b.name));
  }

  const regionMap = regions.map(r => ({
    ...r,
    destinations: destsByRegion.get(r.slug) ?? [],
  }));

  const specialSections = specialSnap.docs
    .map(doc => ({ title: doc.data().title as string, slug: doc.data().slug as string }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return { regions: regionMap, specialSections };
}

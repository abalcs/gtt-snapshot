import { getDb } from '../../db/database';
import { getCached, setCache, invalidateCache } from './data-cache';
import { getIsoCode } from './country-flags';
import type { TravelData } from './types';

const db = () => getDb();

function docToTravelData(id: string, data: FirebaseFirestore.DocumentData): TravelData {
  return {
    country_code: id,
    country_name: data.country_name ?? '',
    advisory_level: data.advisory_level ?? null,
    advisory_summary: data.advisory_summary ?? null,
    advisory_link: data.advisory_link ?? null,
    advisory_updated: data.advisory_updated ?? null,
    visa_status: data.visa_status ?? null,
    visa_max_days: data.visa_max_days ?? null,
    entry_exit_info: data.entry_exit_info ?? null,
    health_vaccines_recommended: data.health_vaccines_recommended ?? [],
    health_vaccines_required: data.health_vaccines_required ?? [],
    health_malaria_info: data.health_malaria_info ?? null,
    health_notes: data.health_notes ?? null,
    synced_at: data.synced_at ?? '',
    advisory_synced_at: data.advisory_synced_at ?? null,
    visa_synced_at: data.visa_synced_at ?? null,
    health_synced_at: data.health_synced_at ?? null,
  };
}

export async function getTravelDataByCode(code: string): Promise<TravelData | null> {
  const upper = code.toUpperCase();
  const cacheKey = `travel_data:${upper}`;
  const cached = getCached<TravelData>(cacheKey);
  if (cached) return cached;

  const doc = await db().collection('travel_data').doc(upper).get();
  if (!doc.exists) return null;

  return setCache(cacheKey, docToTravelData(doc.id, doc.data()!));
}

export async function getTravelDataForDestination(destinationName: string): Promise<TravelData | null> {
  const isoCode = getIsoCode(destinationName);
  if (!isoCode) return null;
  return getTravelDataByCode(isoCode);
}

export async function getAllTravelData(): Promise<TravelData[]> {
  const cached = getCached<TravelData[]>('travel_data:all');
  if (cached) return cached;

  const snap = await db().collection('travel_data').get();
  const results = snap.docs.map(doc => docToTravelData(doc.id, doc.data()));
  results.sort((a, b) => a.country_name.localeCompare(b.country_name));

  return setCache('travel_data:all', results);
}

export async function upsertTravelData(code: string, data: Partial<TravelData>): Promise<void> {
  const upper = code.toUpperCase();
  const writeData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    writeData[key] = value ?? null;
  }
  writeData.synced_at = new Date().toISOString();

  await db().collection('travel_data').doc(upper).set(writeData, { merge: true });
  invalidateCache();
}

export async function batchUpsertTravelData(
  entries: { code: string; data: Partial<TravelData> }[]
): Promise<void> {
  // Firestore batch limit is 500 operations
  const batchSize = 450;
  for (let i = 0; i < entries.length; i += batchSize) {
    const chunk = entries.slice(i, i + batchSize);
    const batch = db().batch();

    for (const entry of chunk) {
      const upper = entry.code.toUpperCase();
      const writeData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(entry.data)) {
        writeData[key] = value ?? null;
      }
      writeData.synced_at = new Date().toISOString();

      const ref = db().collection('travel_data').doc(upper);
      batch.set(ref, writeData, { merge: true });
    }

    await batch.commit();
  }

  invalidateCache();
}

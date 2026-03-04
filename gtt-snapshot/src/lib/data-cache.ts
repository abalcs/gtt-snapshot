// In-memory cache with TTL for frequently-read Firestore data.
// Data changes are infrequent (admin edits only), so a 2-minute TTL is safe.

const cache = new Map<string, { data: unknown; expires: number }>();
const DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): T {
  cache.set(key, { data, expires: Date.now() + ttl });
  return data;
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

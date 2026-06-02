import { getDb } from "@/../db/database";
import { getCached, setCache, invalidateCache } from "@/lib/data-cache";
import type { TceArticle } from "@/lib/tce-data";

const COLLECTION = "tce-articles";
const CACHE_KEY = "tce-articles";

export async function getTceArticles(): Promise<TceArticle[]> {
  const cached = getCached<TceArticle[]>(CACHE_KEY);
  if (cached) return cached;

  const snap = await getDb()
    .collection(COLLECTION)
    .orderBy("sort_order", "asc")
    .get();

  const articles = snap.docs.map((d) => ({
    slug: d.id,
    ...d.data(),
  })) as TceArticle[];

  return setCache(CACHE_KEY, articles);
}

export async function createTceArticle(data: Omit<TceArticle, 'created_at' | 'updated_at'>): Promise<string> {
  const now = new Date().toISOString();
  await getDb().collection(COLLECTION).doc(data.slug).set({
    title: data.title,
    category: data.category,
    content: data.content,
    sort_order: data.sort_order,
    created_at: now,
    updated_at: now,
  });
  invalidateCache(CACHE_KEY);
  return data.slug;
}

export async function updateTceArticle(
  slug: string,
  data: Partial<Pick<TceArticle, 'title' | 'category' | 'content' | 'sort_order'>>
): Promise<void> {
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };
  if (data.title !== undefined) updates.title = data.title;
  if (data.category !== undefined) updates.category = data.category;
  if (data.content !== undefined) updates.content = data.content;
  if (data.sort_order !== undefined) updates.sort_order = data.sort_order;

  await getDb().collection(COLLECTION).doc(slug).update(updates);
  invalidateCache(CACHE_KEY);
}

export async function deleteTceArticle(slug: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(slug).delete();
  invalidateCache(CACHE_KEY);
}

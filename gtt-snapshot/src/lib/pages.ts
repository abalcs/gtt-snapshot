import { getDb } from "../../db/database";
import type { PageBlock, PageDoc } from "./types";
import { PAGE_SECTIONS } from "./types";

const db = () => getDb();
const COLLECTION = "pages";

function docToPage(id: string, data: FirebaseFirestore.DocumentData): PageDoc {
  return {
    id,
    title: data.title ?? "",
    slug: data.slug ?? id,
    summary: data.summary ?? "",
    icon: data.icon ?? "book",
    section: data.section ?? "Guides",
    sort_order: data.sort_order ?? 0,
    status: data.status === "draft" ? "draft" : "published",
    visible: data.visible !== false,
    blocks: Array.isArray(data.blocks) ? (data.blocks as PageBlock[]) : [],
    created_at: data.created_at ?? "",
    updated_at: data.updated_at ?? "",
  };
}

function sortPages(pages: PageDoc[]): PageDoc[] {
  const sectionRank = (s: string) => {
    const i = (PAGE_SECTIONS as readonly string[]).indexOf(s);
    return i === -1 ? PAGE_SECTIONS.length : i;
  };
  return [...pages].sort(
    (a, b) =>
      sectionRank(a.section) - sectionRank(b.section) ||
      a.sort_order - b.sort_order ||
      a.title.localeCompare(b.title)
  );
}

export function slugifyPageTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ── One-time lazy seed ──────────────────────────────────
// The first time the pages collection is read while empty, the existing
// special sections are copied in as pages (one rich-text block each), so
// nothing has to be migrated by hand. The originals stay untouched and
// their /special/<slug> routes keep working.
let seedPromise: Promise<void> | null = null;

export function ensurePagesSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db().collection(COLLECTION).limit(1).get();
      if (!existing.empty) return;
      const special = await db().collection("special_sections").get();
      if (special.empty) return;
      const now = new Date().toISOString();
      const docs = [...special.docs].sort((a, b) =>
        String(a.data().title ?? "").localeCompare(String(b.data().title ?? ""))
      );
      let order = 0;
      for (const doc of docs) {
        const d = doc.data();
        const slug = (d.slug as string) ?? doc.id;
        await db()
          .collection(COLLECTION)
          .doc(slug)
          .set({
            title: d.title ?? slug,
            slug,
            summary: "",
            icon: "book",
            section: "Guides",
            sort_order: order++,
            status: "published",
            visible: true,
            blocks: [{ type: "richtext", markdown: d.content ?? "" }],
            created_at: now,
            updated_at: now,
          });
      }
    })().catch(() => {
      // Never let seeding break a page read; it will retry on the next read.
      seedPromise = null;
    });
  }
  return seedPromise;
}

// ── Reads ───────────────────────────────────────────────

export async function getAllPages(): Promise<PageDoc[]> {
  await ensurePagesSeeded();
  const snap = await db().collection(COLLECTION).get();
  return sortPages(snap.docs.map((d) => docToPage(d.id, d.data())));
}

export async function getPublishedPages(): Promise<PageDoc[]> {
  await ensurePagesSeeded();
  const snap = await db().collection(COLLECTION).get();
  const pages = snap.docs
    .map((d) => docToPage(d.id, d.data()))
    .filter((p) => p.status === "published" && p.visible);
  return sortPages(pages);
}

export async function getPageBySlug(
  slug: string,
  opts: { includeDrafts?: boolean } = {}
): Promise<PageDoc | null> {
  await ensurePagesSeeded();
  const doc = await db().collection(COLLECTION).doc(slug).get();
  if (!doc.exists) return null;
  const page = docToPage(doc.id, doc.data()!);
  if (!opts.includeDrafts && page.status !== "published") return null;
  return page;
}

// ── Writes (admin only; enforced in the API routes) ─────

export interface PageInput {
  title: string;
  slug?: string;
  summary?: string;
  icon?: string;
  section?: string;
  status?: "published" | "draft";
  visible?: boolean;
  blocks?: PageBlock[];
}

function cleanBlocks(blocks: PageBlock[] | undefined): PageBlock[] {
  if (!Array.isArray(blocks)) return [];
  // JSON round-trip strips undefined fields, which Firestore rejects.
  return JSON.parse(JSON.stringify(blocks)) as PageBlock[];
}

export async function createPage(input: PageInput): Promise<PageDoc> {
  const title = input.title?.trim();
  if (!title) throw new Error("A title is required");
  const slug = slugifyPageTitle(input.slug?.trim() || title);
  if (!slug) throw new Error("The title does not produce a usable web address");
  const ref = db().collection(COLLECTION).doc(slug);
  const existing = await ref.get();
  if (existing.exists) {
    throw new Error(`A page with the address "${slug}" already exists`);
  }
  const siblings = await db().collection(COLLECTION).get();
  const now = new Date().toISOString();
  const data = {
    title,
    slug,
    summary: input.summary ?? "",
    icon: input.icon ?? "book",
    section: input.section ?? "Guides",
    sort_order: siblings.size,
    status: input.status === "draft" ? "draft" : "published",
    visible: input.visible !== false,
    blocks: cleanBlocks(input.blocks),
    created_at: now,
    updated_at: now,
  };
  await ref.set(data);
  return { id: slug, ...data } as PageDoc;
}

export async function updatePage(
  id: string,
  input: Partial<PageInput> & { sort_order?: number },
  editor: string = ""
): Promise<void> {
  const ref = db().collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) throw new Error("Page not found");
  // Keep a restorable copy of the page as it was before this save.
  await snapshotRevision(id, editor);
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) update.title = input.title;
  if (input.summary !== undefined) update.summary = input.summary;
  if (input.icon !== undefined) update.icon = input.icon;
  if (input.section !== undefined) update.section = input.section;
  if (input.status !== undefined) update.status = input.status;
  if (input.visible !== undefined) update.visible = input.visible;
  if (input.sort_order !== undefined) update.sort_order = input.sort_order;
  if (input.blocks !== undefined) update.blocks = cleanBlocks(input.blocks);
  await ref.update(update);
}

export async function deletePage(id: string): Promise<void> {
  const ref = db().collection(COLLECTION).doc(id);
  const revs = await ref.collection(REVISIONS_SUB).get();
  const batch = db().batch();
  revs.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref);
  await batch.commit();
}

export async function reorderPages(orderedIds: string[]): Promise<void> {
  const batch = db().batch();
  orderedIds.forEach((id, index) => {
    batch.update(db().collection(COLLECTION).doc(id), { sort_order: index });
  });
  await batch.commit();
}

// ── Revisions ───────────────────────────────────────────

const REVISIONS_SUB = "revisions";
const MAX_REVISIONS = 20;

export interface PageRevisionMeta {
  id: string;
  saved_at: string;
  editor: string;
  title: string;
  status: string;
}

async function snapshotRevision(id: string, editor: string): Promise<void> {
  const ref = db().collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return;
  const data = snap.data()!;
  await ref.collection(REVISIONS_SUB).doc().set({
    title: data.title ?? "",
    summary: data.summary ?? "",
    icon: data.icon ?? "book",
    section: data.section ?? "Guides",
    status: data.status ?? "published",
    visible: data.visible !== false,
    blocks: cleanBlocks((data.blocks as PageBlock[]) ?? []),
    saved_at: new Date().toISOString(),
    editor: editor || "",
  });
  const all = await ref.collection(REVISIONS_SUB).orderBy("saved_at", "desc").get();
  if (all.size > MAX_REVISIONS) {
    const batch = db().batch();
    all.docs.slice(MAX_REVISIONS).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function listRevisions(id: string): Promise<PageRevisionMeta[]> {
  const snap = await db()
    .collection(COLLECTION)
    .doc(id)
    .collection(REVISIONS_SUB)
    .orderBy("saved_at", "desc")
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      saved_at: data.saved_at ?? "",
      editor: data.editor ?? "",
      title: data.title ?? "",
      status: data.status ?? "",
    };
  });
}

export async function restoreRevision(
  id: string,
  revisionId: string,
  editor: string
): Promise<void> {
  const ref = db().collection(COLLECTION).doc(id);
  const revSnap = await ref.collection(REVISIONS_SUB).doc(revisionId).get();
  if (!revSnap.exists) throw new Error("That version no longer exists");
  // Snapshot the current state first, so a restore can itself be undone.
  await snapshotRevision(id, editor);
  const data = revSnap.data()!;
  await ref.update({
    title: data.title ?? "",
    summary: data.summary ?? "",
    icon: data.icon ?? "book",
    section: data.section ?? "Guides",
    status: data.status ?? "published",
    visible: data.visible !== false,
    blocks: cleanBlocks((data.blocks as PageBlock[]) ?? []),
    updated_at: new Date().toISOString(),
  });
}

// ── Search ──────────────────────────────────────────────

export interface PageSearchResult {
  page: PageDoc;
  snippet: string;
}

function blockText(block: PageBlock): string {
  switch (block.type) {
    case "heading":
      return block.text;
    case "richtext":
      return block.markdown;
    case "callout":
      return [block.title ?? "", block.text].join(" ");
    case "checklist":
      return block.items.join(" ");
    case "table":
      return [...block.headers, ...block.rows.flat()].join(" ");
    case "accordion":
      return block.items.map((i) => `${i.title} ${i.body}`).join(" ");
    case "links":
      return block.items.map((i) => `${i.label} ${i.description ?? ""}`).join(" ");
    case "cta":
      return [block.label, block.text ?? ""].join(" ");
    case "divider":
      return "";
  }
}

/** Published pages whose title, summary or block content mentions the query. */
export async function searchPages(query: string): Promise<PageSearchResult[]> {
  const sanitized = query.replace(/[^\w\s-]/g, "").trim().toLowerCase();
  if (!sanitized) return [];
  const pages = await getPublishedPages();
  const results: PageSearchResult[] = [];
  for (const page of pages) {
    const body = page.blocks.map(blockText).join("\n");
    const haystack = `${page.title} ${page.summary} ${body}`.toLowerCase();
    if (!haystack.includes(sanitized)) continue;
    const bodyIdx = body.toLowerCase().indexOf(sanitized);
    let snippet = page.summary || "";
    if (bodyIdx >= 0) {
      const start = Math.max(0, bodyIdx - 60);
      const end = Math.min(body.length, bodyIdx + sanitized.length + 80);
      snippet = `${start > 0 ? "…" : ""}${body.slice(start, end).replace(/\s+/g, " ").trim()}${end < body.length ? "…" : ""}`;
    }
    results.push({ page, snippet });
    if (results.length >= 20) break;
  }
  return results;
}

import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { invalidateCache } from "@/lib/data-cache";

interface OldTier {
  tier_label: string;
  price_per_week?: string | null;
  price_per_day?: string | null;
  notes?: string | null;
  sort_order?: number;
}

interface NewTier {
  tier_label: string;
  price_per_week: string | null;
  notes: string | null;
  sort_order: number;
}

interface Footnote {
  label: string;
  price: string;
}

const SKIP_SLUGS = ["multi-country-trips"];

function classifyTier(label: string): { type: "season"; season: "Peak" | "Shoulder" | "Low" } | { type: "star"; season: "Peak" | "Shoulder" | "Low" } | { type: "footnote" } {
  const lower = label.toLowerCase();

  // Footnote items — check first
  if (lower.includes("solo")) return { type: "footnote" };
  if (lower.includes("opulent")) return { type: "footnote" };
  if (lower.includes("cruise") && !lower.includes("season")) return { type: "footnote" };

  // Season keyword matches (highest priority)
  if (lower.includes("peak") || lower.includes("high")) return { type: "season", season: "Peak" };
  if (lower.includes("shoulder") || lower.includes("mid")) return { type: "season", season: "Shoulder" };
  if (lower.includes("low")) return { type: "season", season: "Low" };

  // Star-rating matches
  if (/5[\s*-]*star|5\*/.test(lower)) return { type: "star", season: "Peak" };
  if (/4[\s*-]*star|4\*/.test(lower)) return { type: "star", season: "Shoulder" };
  if (/3[\s*-]*star|3\*/.test(lower)) return { type: "star", season: "Low" };

  // "Audley Standard" or "Standard" → Shoulder
  if (lower.includes("audley standard") || lower === "standard") return { type: "season", season: "Shoulder" };

  // Everything else → footnote
  return { type: "footnote" };
}

function migrateTiers(oldTiers: OldTier[]): { tiers: NewTier[]; footnotes: Footnote[] } {
  const seasons: Record<string, { price: string | null; notes: string | null }> = {};
  const footnotes: Footnote[] = [];

  // First pass: assign season keyword matches
  for (const tier of oldTiers) {
    const result = classifyTier(tier.tier_label);
    const price = tier.price_per_week || tier.price_per_day || null;

    if (result.type === "season") {
      if (!seasons[result.season]) {
        seasons[result.season] = { price, notes: tier.notes ?? null };
      } else {
        // Season slot already filled — make this a footnote
        if (price) footnotes.push({ label: tier.tier_label, price });
      }
    } else if (result.type === "star") {
      // Defer star matches — will fill unfilled slots in second pass
      continue;
    } else {
      if (price) footnotes.push({ label: tier.tier_label, price });
    }
  }

  // Second pass: fill unfilled season slots with star-based matches
  for (const tier of oldTiers) {
    const result = classifyTier(tier.tier_label);
    if (result.type !== "star") continue;

    const price = tier.price_per_week || tier.price_per_day || null;
    if (!seasons[result.season]) {
      seasons[result.season] = { price, notes: tier.notes ?? null };
    } else {
      // Slot already filled by a season match — star becomes footnote
      if (price) footnotes.push({ label: tier.tier_label, price });
    }
  }

  // Build the 3 fixed tiers
  const tiers: NewTier[] = [
    { tier_label: "Peak", price_per_week: seasons["Peak"]?.price ?? null, notes: seasons["Peak"]?.notes ?? null, sort_order: 0 },
    { tier_label: "Shoulder", price_per_week: seasons["Shoulder"]?.price ?? null, notes: seasons["Shoulder"]?.notes ?? null, sort_order: 1 },
    { tier_label: "Low", price_per_week: seasons["Low"]?.price ?? null, notes: seasons["Low"]?.notes ?? null, sort_order: 2 },
  ];

  return { tiers, footnotes };
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const snap = await getDb().collection("destinations").get();
    let migrated = 0;
    let skipped = 0;
    const details: { name: string; footnotes: number }[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();

      // Skip destinations in the skip list
      if (SKIP_SLUGS.includes(doc.id)) {
        skipped++;
        continue;
      }

      const oldTiers: OldTier[] = data.pricing_tiers ?? [];
      if (oldTiers.length === 0) {
        // No tiers — just ensure the standard 3 empty rows + empty footnotes exist
        await doc.ref.update({
          pricing_tiers: [
            { tier_label: "Peak", price_per_week: null, notes: null, sort_order: 0 },
            { tier_label: "Shoulder", price_per_week: null, notes: null, sort_order: 1 },
            { tier_label: "Low", price_per_week: null, notes: null, sort_order: 2 },
          ],
          pricing_footnotes: [],
        });
        migrated++;
        continue;
      }

      // Check if already migrated (has exactly Peak/Shoulder/Low labels)
      const labels = oldTiers.map((t) => t.tier_label);
      if (
        labels.length === 3 &&
        labels[0] === "Peak" &&
        labels[1] === "Shoulder" &&
        labels[2] === "Low" &&
        data.pricing_footnotes !== undefined
      ) {
        skipped++;
        continue;
      }

      const { tiers, footnotes } = migrateTiers(oldTiers);

      await doc.ref.update({
        pricing_tiers: tiers,
        pricing_footnotes: footnotes,
      });

      migrated++;
      details.push({ name: data.name as string, footnotes: footnotes.length });
    }

    invalidateCache();

    return NextResponse.json({
      success: true,
      migrated,
      skipped,
      details: details.sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

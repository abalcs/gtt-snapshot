import type { PricingTier } from "./types";

/**
 * Prices in the data are human strings: "$8.5k", "$7k", "$2.4k-$3k", "$1,200".
 * Parse the first (lowest, for ranges) dollar amount into a number.
 */
export function parsePriceToDollars(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = raw.replace(/,/g, "").match(/\$\s*([\d.]+)\s*(k)?/i);
  if (!match) return null;
  const n = parseFloat(match[1]);
  if (Number.isNaN(n) || n <= 0) return null;
  return match[2] ? n * 1000 : n;
}

/** The cheapest weekly price across a destination's tiers, with its original label. */
export function minWeeklyPrice(
  tiers: PricingTier[] | undefined
): { value: number; label: string } | null {
  let best: { value: number; label: string } | null = null;
  for (const t of tiers ?? []) {
    const value = parsePriceToDollars(t.price_per_week);
    if (value !== null && (!best || value < best.value)) {
      best = { value, label: t.price_per_week ?? "" };
    }
  }
  return best;
}

/** Budget tier slug for an entry (cheapest) weekly price. Mirrors BUDGET_TIERS. */
export function budgetTierForPrice(value: number): string {
  if (value < 5000) return "best-value";
  if (value <= 8000) return "mid-range";
  return "premium";
}

/** Every dollar amount in a price string, so ranges count at both ends. */
export function parseAllPricesToDollars(raw: string | null | undefined): number[] {
  if (!raw) return [];
  const out: number[] = [];
  const re = /\$\s*([\d.]+)\s*(k)?/gi;
  let m: RegExpExecArray | null;
  const cleaned = raw.replace(/,/g, "");
  while ((m = re.exec(cleaned)) !== null) {
    const n = parseFloat(m[1]);
    if (!Number.isNaN(n) && n > 0) out.push(m[2] ? n * 1000 : n);
  }
  return out;
}

/**
 * The stored budget_tiers field is empty across the catalogue, so derive the
 * tiers a destination spans from its weekly prices (a destination whose
 * prices run from $7k to $10.5k is both mid-range and premium). A stored
 * value, when present, wins.
 */
export function deriveBudgetTiers(data: {
  budget_tiers?: string[];
  pricing_tiers?: PricingTier[];
}): string[] {
  if (data.budget_tiers && data.budget_tiers.length > 0) return data.budget_tiers;
  const tiers = new Set<string>();
  for (const t of data.pricing_tiers ?? []) {
    for (const value of parseAllPricesToDollars(t.price_per_week)) {
      tiers.add(budgetTierForPrice(value));
    }
  }
  return [...tiers];
}

import type { SeasonalityEntry } from "./types";

export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_INDEX: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8,
  september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

/** Seasonality is stored as a JSON string in some docs and an array in others. */
export function parseSeasonalityRaw(raw: unknown): SeasonalityEntry[] {
  if (!raw) return [];
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (e): e is SeasonalityEntry =>
      !!e && typeof e === "object" && "level" in e && "date_range" in e
  );
}

/**
 * Months (0-11) covered by a human date_range such as "June-Oct",
 * "May/June & Nov", or "Dec (holidays), May-Sept".
 */
export function monthsInRange(dateRange: string): Set<number> {
  const months = new Set<number>();
  const cleaned = dateRange.replace(/\([^)]*\)/g, " ");
  for (const part of cleaned.split(/[,&]/)) {
    const tokens = part.toLowerCase().match(/[a-z]+/g) ?? [];
    const found: number[] = [];
    for (const t of tokens) {
      if (t in MONTH_INDEX) found.push(MONTH_INDEX[t]);
    }
    if (found.length === 0) continue;
    const isRange = part.includes("-") || part.includes("–");
    if (isRange && found.length >= 2) {
      let m = found[0];
      const end = found[found.length - 1];
      for (let i = 0; i < 12; i++) {
        months.add(m);
        if (m === end) break;
        m = (m + 1) % 12;
      }
    } else {
      found.forEach((m) => months.add(m));
    }
  }
  return months;
}

export interface SeasonMonths {
  peak: Set<number>;
  shoulder: Set<number>;
  low: Set<number>;
}

export function seasonMonths(entries: SeasonalityEntry[]): SeasonMonths {
  const out: SeasonMonths = { peak: new Set(), shoulder: new Set(), low: new Set() };
  for (const e of entries) {
    const level = (e.level || "").toLowerCase();
    const target = level.includes("peak")
      ? out.peak
      : level.includes("shoulder")
        ? out.shoulder
        : level.includes("low")
          ? out.low
          : null;
    if (!target) continue;
    monthsInRange(e.date_range || "").forEach((m) => target.add(m));
  }
  return out;
}

/** "Jun–Oct", "Jun–Oct, Dec", "Year-round", or "" for an empty set. */
export function describeMonths(set: Set<number>): string {
  if (set.size === 0) return "";
  if (set.size === 12) return "Year-round";
  const sorted = [...set].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  const flush = () => {
    ranges.push(
      start === prev
        ? MONTH_LABELS[start]
        : `${MONTH_LABELS[start]}–${MONTH_LABELS[prev]}`
    );
  };
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      flush();
      start = prev = sorted[i];
    }
  }
  flush();
  return ranges.join(", ");
}

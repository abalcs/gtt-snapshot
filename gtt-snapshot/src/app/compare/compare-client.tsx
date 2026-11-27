"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Destination, TagDefinition } from "@/lib/types";
import { getCoordinates } from "@/lib/country-coordinates";
import { US_DEPARTURE_CITIES, getFlightTimeForSlug, formatFlightTime } from "@/lib/flight-time";
import { getFlagUrl } from "@/lib/country-flags";
import { MONTH_LABELS, parseSeasonalityRaw, seasonMonths, describeMonths } from "@/lib/seasonality-months";
import { minWeeklyPrice } from "@/lib/pricing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CompareClientProps {
  allDestinations: Destination[];
  tagDefinitions: TagDefinition[];
  initialSlugs: string[];
  pricingVisible?: boolean;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  not_selling: { label: "Not Selling", color: "bg-yellow-100 text-yellow-800" },
  stop_sell: { label: "Stop Sell", color: "bg-red-100 text-red-800" },
};

export function CompareClient({ allDestinations, tagDefinitions, initialSlugs, pricingVisible = true }: CompareClientProps) {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);
  const [pickerOpen, setPickerOpen] = useState(initialSlugs.length === 0);
  const [searchValue, setSearchValue] = useState("");
  const [departureCity, setDepartureCity] = useState("JFK");
  const [diffOnly, setDiffOnly] = useState(false);

  const destMap = useMemo(() => {
    const map = new Map<string, Destination>();
    for (const d of allDestinations) map.set(d.slug, d);
    return map;
  }, [allDestinations]);

  const tagMap = useMemo(() => {
    const map = new Map<string, TagDefinition>();
    for (const t of tagDefinitions) map.set(t.slug, t);
    return map;
  }, [tagDefinitions]);

  const selected = selectedSlugs.map((s) => destMap.get(s)).filter(Boolean) as Destination[];
  // ── Comparison model ──────────────────────────────────
  const flightHours = selected.map((d) => {
    const coords = getCoordinates(d.slug);
    return coords ? getFlightTimeForSlug(departureCity, coords.lat, coords.lng) : null;
  });
  const peakCounts = selected.map(
    (d) => seasonMonths(parseSeasonalityRaw(d.seasonality)).peak.size
  );
  const minPrices = selected.map((d) => minWeeklyPrice(d.pricing_tiers)?.value ?? null);
  const minPriceLabels = selected.map((d) => minWeeklyPrice(d.pricing_tiers)?.label ?? null);

  function bestIndex(values: (number | null)[], mode: "min" | "max"): number | null {
    const present = values.filter((v) => v !== null) as number[];
    if (present.length < 2) return null;
    const target = mode === "min" ? Math.min(...present) : Math.max(...present);
    if (present.filter((v) => v === target).length !== 1) return null;
    return values.indexOf(target);
  }

  interface CmpRow {
    label: string;
    cells: React.ReactNode[];
    keys: string[];
    best: number | null;
    bestLabel?: string;
  }

  const rows: CmpRow[] = selected.length >= 2 ? [
    {
      label: "Status",
      cells: selected.map((d) => {
        const s = statusLabels[d.status] || { label: d.status, color: "bg-gray-100 text-gray-800" };
        return <Badge variant="outline" className={`text-xs ${s.color}`}>{s.label}</Badge>;
      }),
      keys: selected.map((d) => d.status),
      best: null,
    },
    {
      label: `Flight Time from ${departureCity}`,
      cells: flightHours.map((h) => (h ? <span>{formatFlightTime(h)}</span> : <Dash />)),
      keys: flightHours.map((h) => (h ? h.toFixed(1) : "")),
      best: bestIndex(flightHours, "min"),
      bestLabel: "Shortest flight",
    },
    {
      label: "Seasonality",
      cells: selected.map((d) => <SeasonStrip key={d.slug} dest={d} />),
      keys: selected.map((d) =>
        [...seasonMonths(parseSeasonalityRaw(d.seasonality)).peak].sort((a, b) => a - b).join(",")
      ),
      best: bestIndex(peakCounts, "max"),
      bestLabel: "Longest peak season",
    },
    {
      label: "Pricing",
      cells: selected.map((d) =>
        d.pricing_tiers.length > 0 ? (
          !pricingVisible ? (
            <span className="text-xs text-muted-foreground italic">Hidden</span>
          ) : (
            <div className="space-y-1">
              {d.pricing_tiers.map((t, i) => (
                <div key={i} className="text-xs">
                  <span className="font-medium">{t.tier_label}:</span>{" "}
                  {t.price_per_week ? <span>{t.price_per_week}/wk</span> : <span className="text-muted-foreground">{"—"}</span>}
                </div>
              ))}
              {(d.pricing_footnotes ?? []).map((fn, i) => (
                <div key={`fn-${i}`} className="text-xs text-muted-foreground">
                  <span className="font-medium">{fn.label}:</span> from {fn.price}
                </div>
              ))}
            </div>
          )
        ) : <Dash />
      ),
      keys: minPrices.map((n) => (n ? String(n) : "")),
      best: pricingVisible ? bestIndex(minPrices, "min") : null,
      bestLabel: "Lowest weekly price",
    },
    {
      label: "Solo Pricing",
      cells: selected.map((d) =>
        d.solo_pricing ? (
          !pricingVisible ? <span className="text-xs text-muted-foreground italic">Hidden</span> : <span>{d.solo_pricing}</span>
        ) : <Dash />
      ),
      keys: selected.map((d) => d.solo_pricing || ""),
      best: null,
    },
    {
      label: "Night Min",
      cells: selected.map((d) => (d.night_min ? <span>{d.night_min}</span> : <Dash />)),
      keys: selected.map((d) => String(d.night_min ?? "")),
      best: null,
    },
    {
      label: "Pax Limit",
      cells: selected.map((d) => (d.pax_limit ? <span>{d.pax_limit}</span> : <Dash />)),
      keys: selected.map((d) => d.pax_limit || ""),
      best: null,
    },
    {
      label: "Talking Points",
      cells: selected.map((d) =>
        d.talking_points ? <span className="whitespace-pre-line">{d.talking_points}</span> : <Dash />
      ),
      keys: selected.map((d) => d.talking_points || ""),
      best: null,
    },
    {
      label: "Good For",
      cells: selected.map((d) => (d.client_types_good ? <span>{d.client_types_good}</span> : <Dash />)),
      keys: selected.map((d) => d.client_types_good || ""),
      best: null,
    },
    {
      label: "Okay For",
      cells: selected.map((d) => (d.client_types_okay ? <span>{d.client_types_okay}</span> : <Dash />)),
      keys: selected.map((d) => d.client_types_okay || ""),
      best: null,
    },
    {
      label: "Bad For",
      cells: selected.map((d) => (d.client_types_bad ? <span>{d.client_types_bad}</span> : <Dash />)),
      keys: selected.map((d) => d.client_types_bad || ""),
      best: null,
    },
    {
      label: "Mobility",
      cells: selected.map((d) => {
        const scores: string[] = [];
        if (d.terrain_difficulty != null) scores.push(`Terrain: ${d.terrain_difficulty}/5`);
        if (d.wheelchair_friendliness != null) scores.push(`Wheelchair: ${d.wheelchair_friendliness}/5`);
        if (d.walking_required != null) scores.push(`Walking: ${d.walking_required}/5`);
        if (d.altitude_concern != null) scores.push(`Altitude: ${d.altitude_concern}/5`);
        return scores.length > 0 ? (
          <div className="space-y-0.5">
            {scores.map((s, i) => (
              <div key={i} className="text-xs">{s}</div>
            ))}
          </div>
        ) : <Dash />;
      }),
      keys: selected.map((d) =>
        [d.terrain_difficulty, d.wheelchair_friendliness, d.walking_required, d.altitude_concern].join("/")
      ),
      best: null,
    },
    {
      label: "Tags",
      cells: selected.map((d) =>
        d.tags && d.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {d.tags.map((t) => {
              const def = tagMap.get(t);
              return (
                <Badge key={t} variant="outline" className="text-xs">
                  {def?.label || t}
                </Badge>
              );
            })}
          </div>
        ) : <Dash />
      ),
      keys: selected.map((d) => [...(d.tags ?? [])].sort().join(",")),
      best: null,
    },
    {
      label: "Pair With",
      cells: selected.map((d) => (d.pair_with ? <span>{d.pair_with}</span> : <Dash />)),
      keys: selected.map((d) => d.pair_with || ""),
      best: null,
    },
  ] : [];

  const rowDiffers = (row: CmpRow) => new Set(row.keys).size > 1;
  const visibleRows = diffOnly ? rows.filter(rowDiffers) : rows;

  const glance = selected.map((d, i) => {
    const parts: string[] = [];
    const good = (d.client_types_good || "").split(/[.;]/)[0]?.trim() ?? "";
    if (good) {
      const short = good.length > 64 ? `${good.slice(0, good.lastIndexOf(" ", 64))}…` : good;
      parts.push(`Good for ${short.charAt(0).toLowerCase()}${short.slice(1)}`);
    }
    const peak = describeMonths(seasonMonths(parseSeasonalityRaw(d.seasonality)).peak);
    if (peak) parts.push(`Peak ${peak}`);
    if (pricingVisible && minPriceLabels[i]) parts.push(`From ${minPriceLabels[i]}/wk`);
    if (flightHours[i]) parts.push(`${formatFlightTime(flightHours[i]!)} from ${departureCity}`);
    return parts.join(" · ");
  });


  const updateUrl = (slugs: string[]) => {
    if (slugs.length === 0) {
      router.replace("/compare");
    } else {
      router.replace(`/compare?slugs=${slugs.join(",")}`);
    }
  };

  const addDestination = (slug: string) => {
    if (selectedSlugs.includes(slug) || selectedSlugs.length >= 3) return;
    const next = [...selectedSlugs, slug];
    setSelectedSlugs(next);
    updateUrl(next);
    setSearchValue("");
  };

  const removeDestination = (slug: string) => {
    const next = selectedSlugs.filter((s) => s !== slug);
    setSelectedSlugs(next);
    updateUrl(next);
  };

  const availableDestinations = useMemo(() => {
    const filtered = allDestinations.filter(
      (d) => !selectedSlugs.includes(d.slug)
    );
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [allDestinations, selectedSlugs]);

  const filteredList = useMemo(() => {
    if (!searchValue) return availableDestinations;
    const q = searchValue.toLowerCase();
    return availableDestinations.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.region_name.toLowerCase().includes(q)
    );
  }, [availableDestinations, searchValue]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-[28px] font-semibold tracking-tight">Compare Destinations</h1>
        <p className="text-muted-foreground">
          Select up to 3 destinations to compare side by side
        </p>
      </div>

      {/* Destination Picker */}
      <Card>
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="flex w-full items-center justify-between px-6 pt-4 pb-3 text-left"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-sm">Select Destinations</span>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.map((dest) => (
                  <Badge key={dest.slug} variant="secondary" className="text-xs">
                    {dest.name}
                  </Badge>
                ))}
              </div>
            )}
            {selected.length === 0 && (
              <span className="text-sm text-muted-foreground">None selected</span>
            )}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-muted-foreground shrink-0 transition-transform duration-200 ${pickerOpen ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
            pickerOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <CardContent className="pt-0 pb-4 space-y-3">
              {/* Selected chips (removable) */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selected.map((dest) => (
                    <Badge
                      key={dest.slug}
                      variant="secondary"
                      className="text-sm py-1.5 px-3 flex items-center gap-1.5 cursor-pointer hover:bg-muted"
                      onClick={() => removeDestination(dest.slug)}
                    >
                      {dest.name}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search + scrollable list */}
              {selectedSlugs.length < 3 && (
                <div className="rounded-lg border">
                  <div className="flex items-center gap-2 px-3 py-2 border-b">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <input
                      type="text"
                      placeholder="Search or scroll to find a destination..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {searchValue && (
                      <button
                        onClick={() => setSearchValue("")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredList.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        No destinations found.
                      </div>
                    ) : (
                      filteredList.map((d) => (
                        <button
                          key={d.slug}
                          onClick={() => addDestination(d.slug)}
                          className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                        >
                          <span>{d.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {d.region_name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">
                    {filteredList.length} destination{filteredList.length !== 1 ? "s" : ""} available
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {selected.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground/50 mb-4"><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            <p className="text-muted-foreground">Select 2-3 destinations above to compare them side by side.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Or use the <Link href="/destinations" className="text-primary hover:underline">All Destinations</Link> page to select destinations with the Compare button.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparison */}
      {selected.length >= 2 && (
        <div className="space-y-5">
          {/* Photo headers */}
          <div className={`grid gap-4 ${selected.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {selected.map((d) => (
              <Link
                key={d.slug}
                href={`/destinations/${d.slug}`}
                className="group relative block h-36 overflow-hidden rounded-xl"
              >
                {d.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0d4256] to-[#07222b]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07222b]/90 via-[#07222b]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="flex items-center gap-2.5">
                    {getFlagUrl(d.name) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getFlagUrl(d.name)} alt="" className="h-6 w-9 shrink-0 rounded-[3px] object-cover shadow" />
                    )}
                    <div>
                      <div className="font-serif text-xl font-semibold leading-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
                        {d.name}
                      </div>
                      <div className="text-[11px] font-medium uppercase tracking-wider text-white/75">
                        {d.region_name}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* At a glance */}
          <Card className="border-[#c9a227]/40 bg-[#c9a227]/[0.06]">
            <CardContent className="space-y-1.5 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a5f10]">
                At a glance
              </div>
              {selected.map((d, i) => (
                <p key={d.slug} className="text-sm">
                  <span className="font-semibold text-[#0e4d5c]">{d.name}</span>
                  {glance[i] ? <span className="text-muted-foreground"> — {glance[i]}</span> : null}
                </p>
              ))}
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Flights from</span>
              <Select value={departureCity} onValueChange={setDepartureCity}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {US_DEPARTURE_CITIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={() => setDiffOnly(!diffOnly)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                diffOnly
                  ? "border-[#0e4d5c] bg-[#0e4d5c] text-white"
                  : "border-input bg-background text-muted-foreground hover:border-[#0e4d5c]/50 hover:text-foreground"
              }`}
            >
              Differences only
            </button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-[#c9a227]" /> Peak
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-[#0e4d5c]/45" /> Shoulder
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-muted" /> Low
              </span>
              <span className="hidden sm:inline">Flight times are estimates.</span>
            </div>
          </div>

          {/* Desktop table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse hidden md:table">
              <thead>
                <tr className="bg-[#0e4d5c]/[0.06]">
                  <th className="text-left p-3 border-b font-medium text-sm text-muted-foreground w-40">Field</th>
                  {selected.map((d) => (
                    <th key={d.slug} className="text-left p-3 border-b">
                      <Link href={`/destinations/${d.slug}`} className="font-serif text-base font-semibold text-[#0e4d5c] hover:underline">
                        {d.name}
                      </Link>
                      <div className="text-xs text-muted-foreground font-normal">{d.region_name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <CompareRow
                    key={row.label}
                    label={row.label}
                    values={row.cells}
                    differs={rowDiffers(row)}
                    best={row.best}
                    bestLabel={row.bestLabel}
                  />
                ))}
              </tbody>
            </table>

            {/* Mobile: stacked, driven by the same rows */}
            <div className="md:hidden space-y-6">
              {selected.map((d, i) => (
                <Card key={d.slug} className="overflow-hidden">
                  <div className="relative h-24">
                    {d.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0d4256] to-[#07222b]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07222b]/85 to-transparent" />
                    <div className="absolute bottom-2.5 left-4 font-serif text-lg font-semibold text-white">
                      {d.name}
                    </div>
                  </div>
                  <CardContent className="pt-4 space-y-3">
                    {visibleRows
                      .filter((row) => row.keys[i] !== "")
                      .map((row) => (
                        <MobileField key={row.label} label={row.label} value={row.cells[i]} />
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Single selection prompt */}
      {selected.length === 1 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Add at least one more destination to compare.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

function CompareRow({
  label,
  values,
  differs,
  best,
  bestLabel,
}: {
  label: string;
  values: React.ReactNode[];
  differs: boolean;
  best: number | null;
  bestLabel?: string;
}) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="p-3 text-sm align-top">
        <span className={`flex items-center gap-1.5 ${differs ? "font-semibold text-[#0e4d5c]" : "font-medium text-muted-foreground"}`}>
          {differs && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a227]" />}
          {label}
        </span>
      </td>
      {values.map((v, i) => (
        <td key={i} className="p-3 text-sm align-top">
          {v}
          {best === i && bestLabel && (
            <div className="mt-1.5">
              <span className="inline-block rounded-full bg-[#c9a227]/15 px-2 py-0.5 text-[11px] font-semibold text-[#7a5f10] ring-1 ring-[#c9a227]/50">
                {bestLabel}
              </span>
            </div>
          )}
        </td>
      ))}
    </tr>
  );
}

function SeasonStrip({ dest }: { dest: Destination }) {
  const months = seasonMonths(parseSeasonalityRaw(dest.seasonality));
  return (
    <div className="min-w-44">
      <div className="flex gap-[2px]">
        {MONTH_LABELS.map((m, i) => (
          <div
            key={m}
            title={m}
            className={`flex h-6 flex-1 items-center justify-center rounded-[3px] text-[9px] font-semibold ${
              months.peak.has(i)
                ? "bg-[#c9a227] text-[#3d2f04]"
                : months.shoulder.has(i)
                  ? "bg-[#0e4d5c]/45 text-white"
                  : months.low.has(i)
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/40 text-muted-foreground/50"
            }`}
          >
            {m[0]}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>Jan</span>
        <span>Dec</span>
      </div>
    </div>
  );
}

function MobileField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}

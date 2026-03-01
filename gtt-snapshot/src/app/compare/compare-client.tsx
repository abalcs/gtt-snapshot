"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Destination, TagDefinition, SeasonalityEntry } from "@/lib/types";

interface CompareClientProps {
  allDestinations: Destination[];
  tagDefinitions: TagDefinition[];
  initialSlugs: string[];
}

function parseSeasonality(raw: string | null): SeasonalityEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  not_selling: { label: "Not Selling", color: "bg-yellow-100 text-yellow-800" },
  stop_sell: { label: "Stop Sell", color: "bg-red-100 text-red-800" },
};

export function CompareClient({ allDestinations, tagDefinitions, initialSlugs }: CompareClientProps) {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

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
    setSearchOpen(false);
    setSearchValue("");
  };

  const removeDestination = (slug: string) => {
    const next = selectedSlugs.filter((s) => s !== slug);
    setSelectedSlugs(next);
    updateUrl(next);
  };

  const availableDestinations = allDestinations.filter(
    (d) => !selectedSlugs.includes(d.slug)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compare Destinations</h1>
        <p className="text-muted-foreground">
          Select up to 3 destinations to compare side by side
        </p>
      </div>

      {/* Destination Picker */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {selected.map((dest) => (
            <Badge
              key={dest.slug}
              variant="secondary"
              className="text-sm py-1 px-3 flex items-center gap-1.5 cursor-pointer hover:bg-muted"
              onClick={() => removeDestination(dest.slug)}
            >
              {dest.name}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Badge>
          ))}
        </div>
        {selectedSlugs.length < 3 && (
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-muted-foreground/40 px-3 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Add destination
            </button>
            {searchOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 w-80 rounded-lg border bg-white shadow-lg">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search destinations..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>No destinations found.</CommandEmpty>
                    <CommandGroup>
                      {availableDestinations
                        .filter((d) =>
                          d.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                          d.region_name.toLowerCase().includes(searchValue.toLowerCase())
                        )
                        .slice(0, 10)
                        .map((d) => (
                          <CommandItem
                            key={d.slug}
                            value={d.slug}
                            onSelect={() => addDestination(d.slug)}
                            className="cursor-pointer"
                          >
                            <span>{d.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {d.region_name}
                            </span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* Comparison Table */}
      {selected.length >= 2 && (
        <div className="overflow-x-auto">
          {/* Desktop: table layout */}
          <table className="w-full border-collapse hidden md:table">
            <thead>
              <tr>
                <th className="text-left p-3 border-b font-medium text-sm text-muted-foreground w-40">Field</th>
                {selected.map((d) => (
                  <th key={d.slug} className="text-left p-3 border-b">
                    <Link href={`/destinations/${d.slug}`} className="font-semibold text-primary hover:underline">
                      {d.name}
                    </Link>
                    <div className="text-xs text-muted-foreground font-normal">{d.region_name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Status" values={selected.map((d) => {
                const s = statusLabels[d.status] || { label: d.status, color: "bg-gray-100 text-gray-800" };
                return <Badge variant="outline" className={`text-xs ${s.color}`}>{s.label}</Badge>;
              })} />
              <CompareRow label="Talking Points" values={selected.map((d) =>
                d.talking_points ? <span className="whitespace-pre-line">{d.talking_points}</span> : <Dash />
              )} />
              <CompareRow label="Night Min" values={selected.map((d) =>
                d.night_min || <Dash />
              )} />
              <CompareRow label="Solo Pricing" values={selected.map((d) =>
                d.solo_pricing || <Dash />
              )} />
              <CompareRow label="Pax Limit" values={selected.map((d) =>
                d.pax_limit || <Dash />
              )} />
              <CompareRow label="Pricing" values={selected.map((d) =>
                d.pricing_tiers.length > 0 ? (
                  <div className="space-y-1">
                    {d.pricing_tiers.map((t, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium">{t.tier_label}:</span>{" "}
                        {t.price_per_week && <span>{t.price_per_week}/wk</span>}
                        {t.price_per_day && <span> {t.price_per_day}/day</span>}
                      </div>
                    ))}
                  </div>
                ) : <Dash />
              )} />
              <CompareRow label="Seasonality" values={selected.map((d) => {
                const entries = parseSeasonality(d.seasonality);
                return entries.length > 0 ? (
                  <div className="space-y-1">
                    {entries.map((e, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium">{e.level}:</span> {e.date_range}
                      </div>
                    ))}
                  </div>
                ) : <Dash />;
              })} />
              <CompareRow label="Good For" values={selected.map((d) =>
                d.client_types_good || <Dash />
              )} />
              <CompareRow label="Okay For" values={selected.map((d) =>
                d.client_types_okay || <Dash />
              )} />
              <CompareRow label="Bad For" values={selected.map((d) =>
                d.client_types_bad || <Dash />
              )} />
              <CompareRow label="Tags" values={selected.map((d) =>
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
              )} />
              <CompareRow label="Pair With" values={selected.map((d) =>
                d.pair_with || <Dash />
              )} />
            </tbody>
          </table>

          {/* Mobile: stacked layout */}
          <div className="md:hidden space-y-6">
            {selected.map((d) => {
              const entries = parseSeasonality(d.seasonality);
              const s = statusLabels[d.status] || { label: d.status, color: "bg-gray-100 text-gray-800" };
              return (
                <Card key={d.slug}>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <Link href={`/destinations/${d.slug}`} className="font-semibold text-primary hover:underline text-lg">
                        {d.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{d.region_name}</div>
                    </div>
                    <MobileField label="Status" value={<Badge variant="outline" className={`text-xs ${s.color}`}>{s.label}</Badge>} />
                    {d.talking_points && <MobileField label="Talking Points" value={<span className="whitespace-pre-line">{d.talking_points}</span>} />}
                    {d.night_min && <MobileField label="Night Min" value={d.night_min} />}
                    {d.solo_pricing && <MobileField label="Solo Pricing" value={d.solo_pricing} />}
                    {d.pax_limit && <MobileField label="Pax Limit" value={d.pax_limit} />}
                    {d.pricing_tiers.length > 0 && (
                      <MobileField label="Pricing" value={
                        <div className="space-y-1">
                          {d.pricing_tiers.map((t, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-medium">{t.tier_label}:</span>{" "}
                              {t.price_per_week && <span>{t.price_per_week}/wk</span>}
                              {t.price_per_day && <span> {t.price_per_day}/day</span>}
                            </div>
                          ))}
                        </div>
                      } />
                    )}
                    {entries.length > 0 && (
                      <MobileField label="Seasonality" value={
                        <div className="space-y-1">
                          {entries.map((e, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-medium">{e.level}:</span> {e.date_range}
                            </div>
                          ))}
                        </div>
                      } />
                    )}
                    {d.client_types_good && <MobileField label="Good For" value={d.client_types_good} />}
                    {d.client_types_okay && <MobileField label="Okay For" value={d.client_types_okay} />}
                    {d.client_types_bad && <MobileField label="Bad For" value={d.client_types_bad} />}
                    {d.tags && d.tags.length > 0 && (
                      <MobileField label="Tags" value={
                        <div className="flex flex-wrap gap-1">
                          {d.tags.map((t) => {
                            const def = tagMap.get(t);
                            return <Badge key={t} variant="outline" className="text-xs">{def?.label || t}</Badge>;
                          })}
                        </div>
                      } />
                    )}
                    {d.pair_with && <MobileField label="Pair With" value={d.pair_with} />}
                  </CardContent>
                </Card>
              );
            })}
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

function CompareRow({ label, values }: { label: string; values: React.ReactNode[] }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="p-3 text-sm font-medium text-muted-foreground align-top">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="p-3 text-sm align-top">{v}</td>
      ))}
    </tr>
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

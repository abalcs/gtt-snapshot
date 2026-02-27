"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DestinationDetail, RegionWithCount } from "@/lib/types";
import { TagPicker } from "@/components/admin/tag-picker";

// Common abbreviations that shouldn't trigger sentence splits
const ABBREVIATIONS = /(?:U\.S|Dr|Mr|Mrs|Jr|Sr|St|vs|etc|approx|govt|dept|avg|min|max|hrs?|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\./gi;

function splitIntoFacts(text: string): string[] {
  if (!text.trim()) return [];
  let safe = text;
  const abbrevMatches: string[] = [];
  safe = safe.replace(ABBREVIATIONS, (match) => {
    abbrevMatches.push(match);
    return `__ABBREV${abbrevMatches.length - 1}__`;
  });
  const raw = safe.split(/\.(?=\s+[A-Z])|\n+/);
  return raw
    .map((s) => {
      let restored = s;
      for (let i = 0; i < abbrevMatches.length; i++) {
        restored = restored.replace(`__ABBREV${i}__`, abbrevMatches[i]);
      }
      return restored.trim().replace(/\.$/, "").trim();
    })
    .filter((s) => s.length > 0);
}

function factsToString(facts: string[]): string {
  return facts
    .map((f) => f.trim())
    .filter(Boolean)
    .map((f) => (f.endsWith(".") ? f : f + "."))
    .join(" ");
}

interface PricingTierForm {
  tier_label: string;
  price_per_week: string;
  price_per_day: string;
  notes: string;
  sort_order: number;
}

interface SeasonalityForm {
  level: string;
  date_range: string;
  description: string;
}

interface Props {
  destination?: DestinationDetail;
  regions: RegionWithCount[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function DestinationForm({ destination, regions }: Props) {
  const router = useRouter();
  const isEdit = !!destination;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Basic fields
  const [name, setName] = useState(destination?.name || "");
  const [slug, setSlug] = useState(destination?.slug || "");
  const [regionId, setRegionId] = useState(destination?.region_slug || (regions[0]?.slug || ""));
  const [status, setStatus] = useState(destination?.status || "active");
  const [nightMin, setNightMin] = useState(destination?.night_min || "");
  const [keyFacts, setKeyFacts] = useState<string[]>(() => {
    const parsed = splitIntoFacts(destination?.key_facts || "");
    return parsed.length > 0 ? parsed : [""];
  });
  const [urgency, setUrgency] = useState(destination?.urgency || "");
  const [soloPricing, setSoloPricing] = useState(destination?.solo_pricing || "");
  const [paxLimit, setPaxLimit] = useState(destination?.pax_limit || "");
  const [accommodations, setAccommodations] = useState(destination?.accommodations || "");
  const [howToFeature, setHowToFeature] = useState(destination?.how_to_feature || "");
  const [pairWith, setPairWith] = useState(destination?.pair_with || "");
  const [generalNotes1, setGeneralNotes1] = useState(destination?.general_notes_1 || "");
  const [generalNotes2, setGeneralNotes2] = useState(destination?.general_notes_2 || "");
  const [clientGood, setClientGood] = useState(destination?.client_types_good || "");
  const [clientOkay, setClientOkay] = useState(destination?.client_types_okay || "");
  const [clientBad, setClientBad] = useState(destination?.client_types_bad || "");
  const [updatedBy, setUpdatedBy] = useState(destination?.updated_by || "");
  const [tags, setTags] = useState<string[]>(destination?.tags || []);

  // Seasonality
  const existingSeasonality: SeasonalityForm[] = (() => {
    if (!destination?.seasonality) return [{ level: "", date_range: "", description: "" }];
    try {
      return JSON.parse(destination.seasonality);
    } catch {
      return [{ level: "", date_range: "", description: "" }];
    }
  })();
  const [seasonality, setSeasonality] = useState<SeasonalityForm[]>(existingSeasonality);

  // Pricing tiers
  const existingTiers: PricingTierForm[] = destination?.pricing_tiers?.length
    ? destination.pricing_tiers.map((t) => ({
        tier_label: t.tier_label,
        price_per_week: t.price_per_week || "",
        price_per_day: t.price_per_day || "",
        notes: t.notes || "",
        sort_order: t.sort_order,
      }))
    : [{ tier_label: "", price_per_week: "", price_per_day: "", notes: "", sort_order: 0 }];
  const [pricingTiers, setPricingTiers] = useState<PricingTierForm[]>(existingTiers);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit) setSlug(slugify(val));
  };

  const addPricingTier = () => {
    setPricingTiers([
      ...pricingTiers,
      { tier_label: "", price_per_week: "", price_per_day: "", notes: "", sort_order: pricingTiers.length },
    ]);
  };

  const removePricingTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  const updatePricingTier = (index: number, field: keyof PricingTierForm, value: string) => {
    const updated = [...pricingTiers];
    updated[index] = { ...updated[index], [field]: value };
    setPricingTiers(updated);
  };

  const addSeasonality = () => {
    setSeasonality([...seasonality, { level: "", date_range: "", description: "" }]);
  };

  const removeSeasonality = (index: number) => {
    setSeasonality(seasonality.filter((_, i) => i !== index));
  };

  const updateSeasonality = (index: number, field: keyof SeasonalityForm, value: string) => {
    const updated = [...seasonality];
    updated[index] = { ...updated[index], [field]: value };
    setSeasonality(updated);
  };

  const addKeyFact = () => {
    setKeyFacts([...keyFacts, ""]);
  };

  const removeKeyFact = (index: number) => {
    setKeyFacts(keyFacts.filter((_, i) => i !== index));
  };

  const updateKeyFact = (index: number, value: string) => {
    const updated = [...keyFacts];
    updated[index] = value;
    setKeyFacts(updated);
  };

  const moveKeyFact = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= keyFacts.length) return;
    const updated = [...keyFacts];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setKeyFacts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!updatedBy.trim()) {
      setError("Please enter your name in the 'Updated By' field before saving.");
      setSaving(false);
      return;
    }

    const body = {
      name,
      slug,
      region_id: regionId,
      status,
      night_min: nightMin || null,
      key_facts: factsToString(keyFacts) || null,
      urgency: urgency || null,
      solo_pricing: soloPricing || null,
      pax_limit: paxLimit || null,
      accommodations: accommodations || null,
      how_to_feature: howToFeature || null,
      pair_with: pairWith || null,
      general_notes_1: generalNotes1 || null,
      general_notes_2: generalNotes2 || null,
      client_types_good: clientGood || null,
      client_types_okay: clientOkay || null,
      client_types_bad: clientBad || null,
      seasonality: JSON.stringify(seasonality.filter((s) => s.level || s.date_range)),
      updated_by: updatedBy || null,
      tags,
      pricing_tiers: pricingTiers
        .filter((t) => t.tier_label)
        .map((t, i) => ({ ...t, sort_order: i })),
    };

    try {
      const url = isEdit ? `/api/destinations/${destination.slug}` : "/api/destinations";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!destination || !confirm("Are you sure you want to delete this destination?")) return;

    try {
      const res = await fetch(`/api/destinations/${destination.slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? `Edit: ${destination.name}` : "New Destination"}
        </h1>
        <div className="flex gap-2">
          {isEdit && (
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <select
                id="region"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                {regions.map((r) => (
                  <option key={r.slug} value={r.slug}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'not_selling' | 'stop_sell')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="active">Active</option>
                <option value="not_selling">Not Selling</option>
                <option value="stop_sell">Stop Sell</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nightMin">Night Minimum</Label>
              <Input id="nightMin" value={nightMin} onChange={(e) => setNightMin(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="soloPricing">Solo Pricing</Label>
              <Input id="soloPricing" value={soloPricing} onChange={(e) => setSoloPricing(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="paxLimit">Pax Limit</Label>
              <Input id="paxLimit" value={paxLimit} onChange={(e) => setPaxLimit(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="updatedBy">Updated By <span className="text-red-500">*</span></Label>
            <Input id="updatedBy" value={updatedBy} onChange={(e) => setUpdatedBy(e.target.value)} placeholder="Your name (required)" required />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="urgency">Urgency</Label>
            <Textarea id="urgency" value={urgency} onChange={(e) => setUrgency(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Key Facts</Label>
              <Button type="button" variant="outline" size="sm" onClick={addKeyFact}>
                + Add Fact
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Each row is one bullet point on the destination page. Use ALL CAPS for warnings (e.g., &quot;NO SELF-DRIVE&quot;) — they&apos;ll appear as red alert badges.</p>
            <div className="space-y-2">
              {keyFacts.map((fact, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-muted-foreground text-xs font-mono mt-2.5 w-5 text-right shrink-0">{i + 1}</span>
                  <Textarea
                    value={fact}
                    onChange={(e) => updateKeyFact(i, e.target.value)}
                    rows={2}
                    className="flex-1 text-sm"
                    placeholder="Enter a key fact..."
                  />
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveKeyFact(i, -1)}
                      disabled={i === 0}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveKeyFact(i, 1)}
                      disabled={i === keyFacts.length - 1}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      title="Move down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyFact(i)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="accommodations">Accommodations</Label>
            <Textarea id="accommodations" value={accommodations} onChange={(e) => setAccommodations(e.target.value)} rows={3} />
          </div>
          <div>
            <Label htmlFor="howToFeature">How to Feature</Label>
            <Input id="howToFeature" value={howToFeature} onChange={(e) => setHowToFeature(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pairWith">Pair With</Label>
            <Input id="pairWith" value={pairWith} onChange={(e) => setPairWith(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="generalNotes1">General Notes 1</Label>
            <Textarea id="generalNotes1" value={generalNotes1} onChange={(e) => setGeneralNotes1(e.target.value)} rows={4} />
          </div>
          <div>
            <Label htmlFor="generalNotes2">General Notes 2</Label>
            <Textarea id="generalNotes2" value={generalNotes2} onChange={(e) => setGeneralNotes2(e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Client Types */}
      <Card>
        <CardHeader>
          <CardTitle>Client Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clientGood" className="text-green-700">Good For</Label>
            <Textarea id="clientGood" value={clientGood} onChange={(e) => setClientGood(e.target.value)} rows={3} placeholder="Comma-separated list" />
          </div>
          <div>
            <Label htmlFor="clientOkay" className="text-yellow-700">Okay For</Label>
            <Textarea id="clientOkay" value={clientOkay} onChange={(e) => setClientOkay(e.target.value)} rows={3} placeholder="Comma-separated list" />
          </div>
          <div>
            <Label htmlFor="clientBad" className="text-red-700">Bad For</Label>
            <Textarea id="clientBad" value={clientBad} onChange={(e) => setClientBad(e.target.value)} rows={3} placeholder="Comma-separated list" />
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <TagPicker selected={tags} onChange={setTags} />
        </CardContent>
      </Card>

      {/* Pricing Tiers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pricing Tiers</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addPricingTier}>
            Add Tier
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {pricingTiers.map((tier, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  value={tier.tier_label}
                  onChange={(e) => updatePricingTier(i, "tier_label", e.target.value)}
                  placeholder="e.g., High Season 5*"
                />
              </div>
              <div>
                <Label className="text-xs">Per Week</Label>
                <Input
                  value={tier.price_per_week}
                  onChange={(e) => updatePricingTier(i, "price_per_week", e.target.value)}
                  placeholder="$7k-$10k"
                />
              </div>
              <div>
                <Label className="text-xs">Per Day</Label>
                <Input
                  value={tier.price_per_day}
                  onChange={(e) => updatePricingTier(i, "price_per_day", e.target.value)}
                  placeholder="$800"
                />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input
                  value={tier.notes}
                  onChange={(e) => updatePricingTier(i, "notes", e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePricingTier(i)}
                className="text-red-500 hover:text-red-700"
              >
                X
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Seasonality */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Seasonality</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addSeasonality}>
            Add Season
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {seasonality.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end">
              <div>
                <Label className="text-xs">Level</Label>
                <select
                  value={s.level}
                  onChange={(e) => updateSeasonality(i, "level", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Select...</option>
                  <option value="Peak">Peak</option>
                  <option value="High">High</option>
                  <option value="Shoulder">Shoulder</option>
                  <option value="Low">Low</option>
                  <option value="Year-round">Year-round</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Date Range</Label>
                <Input
                  value={s.date_range}
                  onChange={(e) => updateSeasonality(i, "date_range", e.target.value)}
                  placeholder="Dec-March"
                />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input
                  value={s.description}
                  onChange={(e) => updateSeasonality(i, "description", e.target.value)}
                  placeholder="Hot and dry, peak tourist season"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSeasonality(i)}
                className="text-red-500 hover:text-red-700"
              >
                X
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update Destination" : "Create Destination"}
        </Button>
      </div>
    </form>
  );
}

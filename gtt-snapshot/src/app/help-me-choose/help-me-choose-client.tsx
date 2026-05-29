"use client";

import { useState, useEffect, useCallback } from "react";
import { TAG_CATEGORIES, SEASONS, BUDGET_TIERS, type TagCategory } from "@/lib/tags";
import { DestinationCard } from "@/components/destinations/destination-card";
import type { DestinationWithRegion, TagDefinition } from "@/lib/types";

const categoryActiveMap: Record<TagCategory, string> = {
  'trip-style': 'bg-blue-600 text-white border-blue-600',
  'activities': 'bg-green-600 text-white border-green-600',
  'traveler-profile': 'bg-purple-600 text-white border-purple-600',
  'landscape': 'bg-amber-600 text-white border-amber-600',
};

const categoryInactiveMap: Record<TagCategory, string> = {
  'trip-style': 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  'activities': 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  'traveler-profile': 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  'landscape': 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
};

const seasonActiveMap: Record<string, string> = {
  sky: 'bg-sky-600 text-white border-sky-600 shadow-sm',
  emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
  orange: 'bg-orange-600 text-white border-orange-600 shadow-sm',
  rose: 'bg-rose-600 text-white border-rose-600 shadow-sm',
};

const seasonInactiveMap: Record<string, string> = {
  sky: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
};

export function HelpMeChooseClient() {
  const [tagDefinitions, setTagDefinitions] = useState<TagDefinition[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string[]>([]);
  const [results, setResults] = useState<DestinationWithRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    fetch("/api/tags")
      .then(res => res.json())
      .then(data => setTagDefinitions(data))
      .catch(() => {});
  }, []);

  const toggle = (slug: string) => {
    setSelected(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const toggleSeason = (slug: string) => {
    setSelectedSeasons(prev =>
      prev.includes(slug) ? [] : [slug]
    );
  };

  const toggleBudget = (slug: string) => {
    setSelectedBudget(prev =>
      prev.includes(slug) ? prev.filter(b => b !== slug) : [...prev, slug]
    );
  };

  const clearAll = () => {
    setSelected([]);
    setSelectedSeasons([]);
    setSelectedBudget([]);
    setResults([]);
    setFetched(false);
  };

  const fetchResults = useCallback(async (tags: string[], seasons: string[], budget: string[]) => {
    if (tags.length === 0 && seasons.length === 0 && budget.length === 0) {
      setResults([]);
      setFetched(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tags.length > 0) params.set('tags', tags.join(','));
      if (seasons.length > 0) params.set('seasons', seasons.join(','));
      if (budget.length > 0) params.set('budget', budget.join(','));
      const res = await fetch(`/api/destinations/by-tags?${params.toString()}`);
      const data = await res.json();
      setResults(data.destinations ?? []);
      setFetched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(selected, selectedSeasons, selectedBudget), 300);
    return () => clearTimeout(timer);
  }, [selected, selectedSeasons, selectedBudget, fetchResults]);

  const totalSelections = selected.length + selectedSeasons.length + selectedBudget.length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help Me Choose</h1>
        <p className="text-muted-foreground mt-1">
          Select seasons and tags that match your client&apos;s interests. Results narrow as you add more filters.
        </p>
      </div>

      {/* Season + Tag Picker */}
      <div className="bg-white border rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">What are they looking for?</h2>
          {totalSelections > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Clear all ({totalSelections})
            </button>
          )}
        </div>

        {/* Season Picker */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">When are they traveling?</p>
          <div className="flex flex-wrap gap-2">
            {SEASONS.map(season => {
              const isActive = selectedSeasons.includes(season.slug);
              return (
                <button
                  key={season.slug}
                  onClick={() => toggleSeason(season.slug)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer hover:scale-[1.03] ${
                    isActive
                      ? seasonActiveMap[season.color]
                      : seasonInactiveMap[season.color]
                  }`}
                >
                  {season.label}
                  <span className={`text-xs ${isActive ? 'opacity-80' : 'opacity-60'}`}>{season.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Tier Picker */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">What&apos;s their budget?</p>
          <div className="flex flex-wrap gap-2">
            {BUDGET_TIERS.map(tier => {
              const isActive = selectedBudget.includes(tier.slug);
              return (
                <button
                  key={tier.slug}
                  onClick={() => toggleBudget(tier.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer hover:scale-[1.03]"
                  style={
                    isActive
                      ? { backgroundColor: tier.color, color: 'white', borderColor: tier.color, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }
                      : { backgroundColor: `${tier.color}10`, color: tier.color, borderColor: `${tier.color}40` }
                  }
                >
                  {tier.label}
                  <span className={`text-xs ${isActive ? 'opacity-80' : 'opacity-60'}`}>{tier.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {TAG_CATEGORIES.map(cat => {
          const tags = tagDefinitions.filter(t => t.category === cat.key);
          return (
            <div key={cat.key}>
              <p className="text-sm font-medium text-muted-foreground mb-2">{cat.label}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  const isActive = selected.includes(tag.slug);
                  return (
                    <button
                      key={tag.slug}
                      onClick={() => toggle(tag.slug)}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer hover:scale-[1.03] ${
                        isActive
                          ? `${categoryActiveMap[cat.key]} shadow-sm`
                          : categoryInactiveMap[cat.key]
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Results */}
      <div>
        {loading && (
          <p className="text-sm text-muted-foreground">Searching...</p>
        )}

        {!loading && fetched && results.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#3a5f54] to-[#6b9a88] px-3 py-1 text-xs font-semibold text-white">
                {results.length} destination{results.length !== 1 ? "s" : ""}
              </span>
              <span className="text-sm text-muted-foreground">
                match{results.length === 1 ? "es" : ""} all selected filters
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(dest => (
                <DestinationCard key={dest.id} destination={dest} tagDefinitions={tagDefinitions} />
              ))}
            </div>
          </>
        )}

        {!loading && fetched && results.length === 0 && totalSelections > 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border">
            <p className="text-muted-foreground">No destinations match all selected filters.</p>
            <p className="text-sm text-muted-foreground mt-1">Try removing some filters to broaden the search.</p>
          </div>
        )}

        {!loading && !fetched && totalSelections === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border">
            <p className="text-muted-foreground">Select seasons or tags above to find matching destinations.</p>
          </div>
        )}
      </div>
    </div>
  );
}

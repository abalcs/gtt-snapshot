"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TAG_CATEGORIES, SEASONS, BUDGET_TIERS, type TagCategory } from "@/lib/tags";
import type { TagDefinition } from "@/lib/types";

const categoryActiveMap: Record<TagCategory, string> = {
  'trip-style': 'bg-blue-600 text-white border-blue-600 shadow-sm',
  'activities': 'bg-green-600 text-white border-green-600 shadow-sm',
  'traveler-profile': 'bg-purple-600 text-white border-purple-600 shadow-sm',
  'landscape': 'bg-amber-600 text-white border-amber-600 shadow-sm',
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

interface FilterPanelProps {
  currentTags: string[];
  currentSeasons: string[];
  currentBudget: string[];
  tagDefinitions: TagDefinition[];
}

export function FilterPanel({ currentTags, currentSeasons, currentBudget, tagDefinitions }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalSelections = currentTags.length + currentSeasons.length + currentBudget.length;

  const updateParam = (key: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (values.length > 0) {
      params.set(key, values.join(","));
    } else {
      params.delete(key);
    }
    router.push(`/destinations?${params.toString()}`);
  };

  const toggleTag = (slug: string) => {
    const next = currentTags.includes(slug)
      ? currentTags.filter(s => s !== slug)
      : [...currentTags, slug];
    if (!currentTags.includes(slug)) {
      window.dispatchEvent(new CustomEvent("analytics-track", {
        detail: { type: "filter_tag", filter_type: "tag", filter_value: slug },
      }));
    }
    updateParam("tags", next);
  };

  const toggleSeason = (slug: string) => {
    const next = currentSeasons.includes(slug)
      ? currentSeasons.filter(s => s !== slug)
      : [...currentSeasons, slug];
    if (!currentSeasons.includes(slug)) {
      window.dispatchEvent(new CustomEvent("analytics-track", {
        detail: { type: "filter_season", filter_type: "season", filter_value: slug },
      }));
    }
    updateParam("seasons", next);
  };

  const toggleBudget = (slug: string) => {
    const next = currentBudget.includes(slug)
      ? currentBudget.filter(b => b !== slug)
      : [...currentBudget, slug];
    if (!currentBudget.includes(slug)) {
      window.dispatchEvent(new CustomEvent("analytics-track", {
        detail: { type: "filter_budget", filter_type: "budget", filter_value: slug },
      }));
    }
    updateParam("budget", next);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tags");
    params.delete("seasons");
    params.delete("budget");
    router.push(`/destinations?${params.toString()}`);
  };

  return (
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

      {/* Seasons */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">When are they traveling?</p>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map(season => {
            const isActive = currentSeasons.includes(season.slug);
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

      {/* Budget */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">What&apos;s their budget?</p>
        <div className="flex flex-wrap gap-2">
          {BUDGET_TIERS.map(tier => {
            const isActive = currentBudget.includes(tier.slug);
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

      {/* Tag Categories */}
      {TAG_CATEGORIES.map(cat => {
        const tags = tagDefinitions.filter(t => t.category === cat.key);
        return (
          <div key={cat.key}>
            <p className="text-sm font-medium text-muted-foreground mb-2">{cat.label}</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const isActive = currentTags.includes(tag.slug);
                return (
                  <button
                    key={tag.slug}
                    onClick={() => toggleTag(tag.slug)}
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer hover:scale-[1.03] ${
                      isActive
                        ? categoryActiveMap[cat.key]
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
  );
}

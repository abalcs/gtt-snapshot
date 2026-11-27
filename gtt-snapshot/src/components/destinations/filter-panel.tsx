"use client";

import { TAG_CATEGORIES, SEASONS, BUDGET_TIERS, ACCESSIBILITY_FILTERS, type TagCategory } from "@/lib/tags";
import type { TagDefinition } from "@/lib/types";
import { US_DEPARTURE_CITIES } from "@/lib/flight-time";
import { MONTH_LABELS } from "@/lib/seasonality-months";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export interface ChooserFilters {
  tags: string[];
  seasons: string[];
  budget: string[];
  accessibility: string[];
  months: number[];
  departureCity: string;
  maxFlightTime: number | null;
}

export const EMPTY_FILTERS: ChooserFilters = {
  tags: [],
  seasons: [],
  budget: [],
  accessibility: [],
  months: [],
  departureCity: "",
  maxFlightTime: null,
};

interface FilterPanelProps {
  filters: ChooserFilters;
  onChange: (next: ChooserFilters) => void;
  tagDefinitions: TagDefinition[];
  shownCount: number;
  totalCount: number;
}

const CHIP =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer hover:scale-[1.03]";
const CHIP_ON = "bg-[#0e4d5c] text-white border-[#0e4d5c] shadow-sm";
const CHIP_OFF = "bg-white text-foreground border-input hover:border-[#0e4d5c]/60";
const MONTH_ON = "bg-[#c9a227] text-[#3d2f04] border-[#c9a227] shadow-sm";

function track(type: string, value: string) {
  window.dispatchEvent(
    new CustomEvent("analytics-track", {
      detail: { type: `filter_${type}`, filter_type: type, filter_value: value },
    })
  );
}

export function FilterPanel({ filters, onChange, tagDefinitions, shownCount, totalCount }: FilterPanelProps) {
  const { tags, seasons, budget, accessibility, months, departureCity, maxFlightTime } = filters;

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const toggleTag = (slug: string) => {
    if (!tags.includes(slug)) track("tag", slug);
    onChange({ ...filters, tags: toggleIn(tags, slug) });
  };
  const toggleSeason = (slug: string) => {
    if (!seasons.includes(slug)) track("season", slug);
    onChange({ ...filters, seasons: toggleIn(seasons, slug) });
  };
  const toggleBudget = (slug: string) => {
    if (!budget.includes(slug)) track("budget", slug);
    onChange({ ...filters, budget: toggleIn(budget, slug) });
  };
  const toggleAccessibility = (slug: string) => {
    if (!accessibility.includes(slug)) track("accessibility", slug);
    onChange({ ...filters, accessibility: toggleIn(accessibility, slug) });
  };
  const toggleMonth = (m: number) => {
    onChange({
      ...filters,
      months: months.includes(m) ? months.filter((x) => x !== m) : [...months, m].sort((a, b) => a - b),
    });
  };

  const flightCount = departureCity ? (maxFlightTime !== null && maxFlightTime < 20 ? 2 : 1) : 0;
  const totalSelections =
    tags.length + seasons.length + budget.length + accessibility.length + months.length + flightCount;

  return (
    <div className="space-y-6 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold">Refine the shortlist</h2>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-[#0e4d5c]">{shownCount}</span> of {totalCount} destinations
          </p>
        </div>
        {totalSelections > 0 && (
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Clear all ({totalSelections})
          </button>
        )}
      </div>

      {/* Flight Time */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">How far are they willing to fly?</p>
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={departureCity || undefined}
            onValueChange={(code) =>
              onChange({ ...filters, departureCity: code, maxFlightTime: code ? maxFlightTime : null })
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Departure city" />
            </SelectTrigger>
            <SelectContent>
              {US_DEPARTURE_CITIES.map((city) => (
                <SelectItem key={city.code} value={city.code}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {departureCity && (
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Max flight:</span>
              <Slider
                min={4}
                max={20}
                step={0.5}
                value={[maxFlightTime ?? 20]}
                onValueChange={([v]) => onChange({ ...filters, maxFlightTime: v })}
                className="flex-1"
              />
              <span className="text-sm font-medium text-[#0e4d5c] whitespace-nowrap w-[60px]">
                {maxFlightTime !== null && maxFlightTime < 20 ? `${maxFlightTime}h` : "Any"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Travel months */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">
          Travelling in <span className="normal-case">(matches peak and shoulder seasons)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MONTH_LABELS.map((label, i) => {
            const isActive = months.includes(i);
            return (
              <button
                key={label}
                onClick={() => toggleMonth(i)}
                className={`${CHIP} px-2.5 ${isActive ? MONTH_ON : CHIP_OFF}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seasons */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Best in</p>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((season) => {
            const isActive = seasons.includes(season.slug);
            return (
              <button
                key={season.slug}
                onClick={() => toggleSeason(season.slug)}
                className={`${CHIP} ${isActive ? CHIP_ON : CHIP_OFF}`}
              >
                {season.label}
                <span className={`text-xs ${isActive ? "opacity-80" : "opacity-60"}`}>{season.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">What&apos;s their budget?</p>
        <div className="flex flex-wrap gap-2">
          {BUDGET_TIERS.map((tier) => {
            const isActive = budget.includes(tier.slug);
            return (
              <button
                key={tier.slug}
                onClick={() => toggleBudget(tier.slug)}
                className={`${CHIP} ${isActive ? CHIP_ON : CHIP_OFF}`}
              >
                {tier.label}
                <span className={`text-xs ${isActive ? "opacity-80" : "opacity-60"}`}>{tier.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accessibility */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Accessibility needs?</p>
        <div className="flex flex-wrap gap-2">
          {ACCESSIBILITY_FILTERS.map((filter) => {
            const isActive = accessibility.includes(filter.slug);
            return (
              <button
                key={filter.slug}
                onClick={() => toggleAccessibility(filter.slug)}
                className={`${CHIP} ${isActive ? CHIP_ON : CHIP_OFF}`}
              >
                {filter.label}
                <span className={`text-xs ${isActive ? "opacity-80" : "opacity-60"}`}>{filter.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tag Categories */}
      {TAG_CATEGORIES.map((cat) => {
        const catTags = tagDefinitions.filter((t) => t.category === (cat.key as TagCategory));
        if (catTags.length === 0) return null;
        return (
          <div key={cat.key}>
            <p className="text-sm font-medium text-muted-foreground mb-2">{cat.label}</p>
            <div className="flex flex-wrap gap-2">
              {catTags.map((tag) => {
                const isActive = tags.includes(tag.slug);
                return (
                  <button
                    key={tag.slug}
                    onClick={() => toggleTag(tag.slug)}
                    className={`${CHIP} ${isActive ? CHIP_ON : CHIP_OFF}`}
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

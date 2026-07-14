"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SEASONS } from "@/lib/tags";

const seasonColorMap: Record<string, { active: string; inactive: string }> = {
  sky:     { active: 'bg-sky-600 text-white border-sky-600',       inactive: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
  emerald: { active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  orange:  { active: 'bg-orange-600 text-white border-orange-600',   inactive: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  rose:    { active: 'bg-rose-600 text-white border-rose-600',       inactive: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
};

interface SeasonFilterBarProps {
  currentSeasons: string[];
}

export function SeasonFilterBar({ currentSeasons }: SeasonFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleSeason = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSeasons.includes(slug)) {
      params.delete("seasons");
    } else {
      params.set("seasons", slug);
      window.dispatchEvent(new CustomEvent("analytics-track", {
        detail: { type: "filter_season", filter_type: "season", filter_value: slug },
      }));
    }
    router.push(`/destinations?${params.toString()}`);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Best time to travel</h3>
      <div className="flex flex-wrap gap-1.5">
        {SEASONS.map(season => {
          const isActive = currentSeasons.includes(season.slug);
          const colors = seasonColorMap[season.color] ?? { active: 'bg-gray-600 text-white', inactive: 'bg-gray-50 text-gray-700 border-gray-200' };
          return (
            <button
              key={season.slug}
              onClick={() => toggleSeason(season.slug)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
                isActive ? colors.active : colors.inactive
              }`}
            >
              {season.label}
              <span className={`text-[10px] ${isActive ? 'opacity-80' : 'opacity-60'}`}>{season.subtitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

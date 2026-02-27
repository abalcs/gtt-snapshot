"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ALL_TAGS, TAG_CATEGORIES } from "@/lib/tags";

interface TagFilterBarProps {
  currentTags: string[];
}

export function TagFilterBar({ currentTags }: TagFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleTag = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get("tags")?.split(",").filter(Boolean) ?? [];
    let next: string[];
    if (current.includes(slug)) {
      next = current.filter(s => s !== slug);
    } else {
      next = [...current, slug];
    }
    if (next.length > 0) {
      params.set("tags", next.join(","));
    } else {
      params.delete("tags");
    }
    router.push(`/destinations?${params.toString()}`);
  };

  const clearTags = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tags");
    router.push(`/destinations?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Filter by tags</h3>
        {currentTags.length > 0 && (
          <button
            onClick={clearTags}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear tags ({currentTags.length})
          </button>
        )}
      </div>
      {TAG_CATEGORIES.map(cat => {
        const tags = ALL_TAGS.filter(t => t.category === cat.key);
        return (
          <div key={cat.key} className="flex flex-wrap gap-1.5">
            {tags.map(tag => {
              const isActive = currentTags.includes(tag.slug);
              const colorMap: Record<string, { active: string; inactive: string }> = {
                'trip-style': { active: 'bg-blue-600 text-white border-blue-600', inactive: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
                'activities': { active: 'bg-green-600 text-white border-green-600', inactive: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
                'traveler-profile': { active: 'bg-purple-600 text-white border-purple-600', inactive: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
                'landscape': { active: 'bg-amber-600 text-white border-amber-600', inactive: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
              };
              const colors = colorMap[cat.key] ?? { active: 'bg-gray-600 text-white', inactive: 'bg-gray-50 text-gray-700 border-gray-200' };
              return (
                <button
                  key={tag.slug}
                  onClick={() => toggleTag(tag.slug)}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
                    isActive ? colors.active : colors.inactive
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

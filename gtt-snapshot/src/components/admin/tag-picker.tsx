"use client";

import { useState, useEffect } from "react";
import { TAG_CATEGORIES, type TagCategory } from "@/lib/tags";
import type { TagDefinition } from "@/lib/types";

const categoryColorMap: Record<TagCategory, string> = {
  'trip-style': 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  'activities': 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  'traveler-profile': 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
  'landscape': 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
};

const categoryActiveMap: Record<TagCategory, string> = {
  'trip-style': 'bg-blue-600 text-white border-blue-600',
  'activities': 'bg-green-600 text-white border-green-600',
  'traveler-profile': 'bg-purple-600 text-white border-purple-600',
  'landscape': 'bg-amber-600 text-white border-amber-600',
};

interface TagPickerProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  tagDefinitions?: TagDefinition[];
}

export function TagPicker({ selected, onChange, tagDefinitions }: TagPickerProps) {
  const [tags, setTags] = useState<TagDefinition[]>(tagDefinitions ?? []);

  useEffect(() => {
    if (tagDefinitions) return;
    fetch("/api/tags")
      .then(res => res.json())
      .then(data => setTags(data))
      .catch(() => {});
  }, [tagDefinitions]);

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter(s => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  };

  return (
    <div className="space-y-4">
      {TAG_CATEGORIES.map(cat => {
        const catTags = tags.filter(t => t.category === cat.key);
        const count = catTags.filter(t => selected.includes(t.slug)).length;
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">{cat.label}</span>
              {count > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{count} selected</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {catTags.map(tag => {
                const isActive = selected.includes(tag.slug);
                return (
                  <button
                    key={tag.slug}
                    type="button"
                    onClick={() => toggle(tag.slug)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? categoryActiveMap[cat.key]
                        : categoryColorMap[cat.key] + ' hover:opacity-80'
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
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">{selected.length} tag{selected.length !== 1 ? 's' : ''} selected</p>
      )}
    </div>
  );
}

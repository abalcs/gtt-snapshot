import { type TagCategory } from "@/lib/tags";
import type { TagDefinition } from "@/lib/types";

const colorMap: Record<TagCategory, string> = {
  'trip-style': 'bg-blue-50 text-blue-700 border-blue-200',
  'activities': 'bg-green-50 text-green-700 border-green-200',
  'traveler-profile': 'bg-purple-50 text-purple-700 border-purple-200',
  'landscape': 'bg-amber-50 text-amber-700 border-amber-200',
};

interface TagBadgesProps {
  tags: string[];
  limit?: number;
  tagDefinitions?: TagDefinition[];
}

export function TagBadges({ tags, limit, tagDefinitions }: TagBadgesProps) {
  if (!tags || tags.length === 0) return null;

  const visible = limit ? tags.slice(0, limit) : tags;
  const remaining = limit ? tags.length - limit : 0;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(slug => {
        const tag = tagDefinitions?.find(t => t.slug === slug);
        const label = tag?.label ?? slug;
        const category = tag?.category as TagCategory | undefined;
        const colors = category ? colorMap[category] : 'bg-gray-50 text-gray-700 border-gray-200';
        return (
          <span
            key={slug}
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${colors}`}
          >
            {label}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[10px] font-medium">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

import { getTagBySlug, type TagCategory } from "@/lib/tags";

const colorMap: Record<TagCategory, string> = {
  'trip-style': 'bg-blue-50 text-blue-700 border-blue-200',
  'activities': 'bg-green-50 text-green-700 border-green-200',
  'traveler-profile': 'bg-purple-50 text-purple-700 border-purple-200',
  'landscape': 'bg-amber-50 text-amber-700 border-amber-200',
};

interface TagBadgesProps {
  tags: string[];
  limit?: number;
}

export function TagBadges({ tags, limit }: TagBadgesProps) {
  if (!tags || tags.length === 0) return null;

  const visible = limit ? tags.slice(0, limit) : tags;
  const remaining = limit ? tags.length - limit : 0;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(slug => {
        const tag = getTagBySlug(slug);
        if (!tag) return null;
        return (
          <span
            key={slug}
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${colorMap[tag.category]}`}
          >
            {tag.label}
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

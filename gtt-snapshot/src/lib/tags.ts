import type { TagDefinition } from './types';

export type TagCategory = 'trip-style' | 'activities' | 'traveler-profile' | 'landscape';

export interface Tag {
  slug: string;
  label: string;
  category: TagCategory;
}

export const TAG_CATEGORIES: { key: TagCategory; label: string; color: string }[] = [
  { key: 'trip-style', label: 'Trip Style', color: 'blue' },
  { key: 'activities', label: 'Activities', color: 'green' },
  { key: 'traveler-profile', label: 'Traveler Profile', color: 'purple' },
  { key: 'landscape', label: 'Landscape', color: 'amber' },
];

/** Seed / fallback constant — used by seed script and as offline fallback */
export const ALL_TAGS: Tag[] = [
  // Trip Style (9)
  { slug: 'beaches-and-coast', label: 'Beaches & Coast', category: 'trip-style' },
  { slug: 'safari-and-wildlife', label: 'Safari & Wildlife', category: 'trip-style' },
  { slug: 'cultural-immersion', label: 'Cultural Immersion', category: 'trip-style' },
  { slug: 'history-and-heritage', label: 'History & Heritage', category: 'trip-style' },
  { slug: 'art-and-architecture', label: 'Art & Architecture', category: 'trip-style' },
  { slug: 'food-and-wine', label: 'Food & Wine', category: 'trip-style' },
  { slug: 'adventure-and-outdoors', label: 'Adventure & Outdoors', category: 'trip-style' },
  { slug: 'relaxation-and-wellness', label: 'Relaxation & Wellness', category: 'trip-style' },
  { slug: 'off-the-beaten-path', label: 'Off the Beaten Path', category: 'trip-style' },

  // Activities (7)
  { slug: 'hiking-and-trekking', label: 'Hiking & Trekking', category: 'activities' },
  { slug: 'diving-and-snorkeling', label: 'Diving & Snorkeling', category: 'activities' },
  { slug: 'water-sports', label: 'Water Sports', category: 'activities' },
  { slug: 'scenic-train-journeys', label: 'Scenic Train Journeys', category: 'activities' },
  { slug: 'whale-watching', label: 'Whale Watching', category: 'activities' },
  { slug: 'birding', label: 'Birding', category: 'activities' },
  { slug: 'photography', label: 'Photography', category: 'activities' },

  // Traveler Profile (8)
  { slug: 'honeymoon-and-romance', label: 'Honeymoon & Romance', category: 'traveler-profile' },
  { slug: 'family-friendly', label: 'Family Friendly', category: 'traveler-profile' },
  { slug: 'multigenerational', label: 'Multigenerational', category: 'traveler-profile' },
  { slug: 'solo-traveler', label: 'Solo Traveler', category: 'traveler-profile' },
  { slug: 'first-international-trip', label: 'First International Trip', category: 'traveler-profile' },
  { slug: 'bucket-list', label: 'Bucket List / Once-in-a-Lifetime', category: 'traveler-profile' },
  { slug: 'luxury', label: 'Luxury', category: 'traveler-profile' },
  { slug: 'active-seniors', label: 'Active Seniors', category: 'traveler-profile' },

  // Landscape (3)
  { slug: 'mountains-and-alpine', label: 'Mountains & Alpine', category: 'landscape' },
  { slug: 'desert-and-dunes', label: 'Desert & Dunes', category: 'landscape' },
  { slug: 'tropical-islands', label: 'Tropical Islands', category: 'landscape' },
];

// ── Helpers that work with a passed-in array (or fallback to ALL_TAGS) ──

export function getTagBySlug(slug: string, tags: TagDefinition[] = ALL_TAGS): Tag | undefined {
  return tags.find(t => t.slug === slug) as Tag | undefined;
}

export function getTagsByCategory(category: TagCategory, tags: TagDefinition[] = ALL_TAGS): Tag[] {
  return tags.filter(t => t.category === category) as Tag[];
}

export function getTagLabel(slug: string, tags: TagDefinition[] = ALL_TAGS): string {
  return getTagBySlug(slug, tags)?.label ?? slug;
}

export function getCategoryColor(category: TagCategory): string {
  return TAG_CATEGORIES.find(c => c.key === category)?.color ?? 'gray';
}

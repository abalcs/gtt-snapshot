export interface Region {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface Destination {
  id: string;
  region_id: string;
  region_name: string;
  region_slug: string;
  name: string;
  slug: string;
  night_min: string | null;
  key_facts: string | null;
  urgency: string | null;
  solo_pricing: string | null;
  pax_limit: string | null;
  accommodations: string | null;
  how_to_feature: string | null;
  talking_points: string | null;
  pair_with: string | null;
  general_notes_1: string | null;
  general_notes_2: string | null;
  client_types_good: string | null;
  client_types_okay: string | null;
  client_types_bad: string | null;
  seasonality: string | null;
  status: 'active' | 'not_selling' | 'stop_sell';
  date_updated: string | null;
  updated_by: string | null;
  cs_rsm_source: string | null;
  summary_of_changes: string | null;
  created_at: string;
  updated_at: string;
  search_tokens: string[];
  pricing_tiers: PricingTier[];
  tags: string[];
}

export interface DestinationWithRegion extends Destination {}

export interface PricingTier {
  tier_label: string;
  price_per_week: string | null;
  price_per_day: string | null;
  notes: string | null;
  sort_order: number;
}

export interface SpecialSection {
  id: string;
  title: string;
  slug: string;
  content: string;
  region_scope: string | null;
}

export interface DestinationDetail extends Destination {}

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  region_name: string;
  region_slug: string;
  snippet: string;
  rank: number;
}

export interface RegionWithCount extends Region {
  destination_count: number;
}

export interface SeasonalityEntry {
  level: string;
  date_range: string;
  description: string;
}

export interface TagDefinition {
  slug: string;
  label: string;
  category: 'trip-style' | 'activities' | 'traveler-profile' | 'landscape';
}

export interface AdminLogEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  target_name: string;
  target_slug: string;
  updated_by: string;
  changes: { field: string; from?: string | null; to?: string | null }[];
  timestamp: string;
}

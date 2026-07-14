// ── Analytics Event Types ────────────────────────────────

export type AnalyticsEventType =
  | 'page_view'
  | 'search'
  | 'filter_season'
  | 'filter_budget'
  | 'filter_tag'
  | 'compare'
  | 'help_me_choose';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: string;
  path: string;
  destination?: string;
  search_query?: string;
  search_results?: number;
  feature?: string;
  filter_type?: string;
  filter_value?: string;
}

export interface AnalyticsEventBatch {
  user_email: string;
  user_name: string;
  flushed_at: string;
  events: AnalyticsEvent[];
}

// ── Daily Rollup ─────────────────────────────────────────

export interface AnalyticsDaily {
  date: string;
  total_page_views: number;
  unique_users: string[];
  destination_views: Record<string, number>;
  searches: Record<string, number>;
  zero_result_searches: string[];
  feature_usage: Record<string, number>;
  filter_usage: Record<string, number>;
  hourly_views: number[];
}

// ── User Profile ─────────────────────────────────────────

export interface AnalyticsUser {
  email: string;
  name: string;
  last_active: string;
  total_page_views: number;
  total_searches: number;
  active_days: string[];
  favorite_destinations: Record<string, number>;
}

// ── Dashboard API Response ───────────────────────────────

export interface AnalyticsDashboardData {
  overview: {
    active_users_today: number;
    page_views_7d: number;
    searches_7d: number;
    top_destination: { slug: string; count: number } | null;
    daily_views: { date: string; views: number }[];
    hourly_views: number[];
  };
  users: {
    email: string;
    name: string;
    last_active: string;
    page_views_30d: number;
    active_days_count: number;
    top_destination: string | null;
  }[];
  pages: {
    slug: string;
    views: number;
  }[];
  searches: {
    query: string;
    count: number;
    zero_results: boolean;
  }[];
  features: {
    name: string;
    count: number;
  }[];
  filters: {
    key: string;
    count: number;
  }[];
}

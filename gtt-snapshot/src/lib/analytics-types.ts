// ── Analytics Event Types ────────────────────────────────

export type AnalyticsEventType =
  | 'page_view'
  | 'page_leave'
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
  session_id?: string;
  dwell_ms?: number;
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

// ── V2 Analytics Types ──────────────────────────────────

export interface PeriodComparison {
  current: number;
  previous: number;
  change_pct: number;
}

export interface HeatmapCell {
  day: number; // 0=Sun, 6=Sat
  hour: number; // 0-23
  value: number;
}

export type EngagementTier = 'power' | 'regular' | 'inactive';

export interface UserEngagement {
  email: string;
  name: string;
  last_active: string;
  page_views_30d: number;
  active_days_count: number;
  top_destination: string | null;
  tier: EngagementTier;
  engagement_score: number;
  features_used: string[];
}

export interface DestinationTrend {
  slug: string;
  current_views: number;
  previous_views: number;
  change_pct: number;
  daily_views: number[];
}

export interface FunnelStage {
  label: string;
  count: number;
  pct_of_top: number;
}

export interface ContentCoverage {
  slug: string;
  name: string;
  region: string;
  views_30d: number;
  status: string;
}

export interface ActivityFeedItem {
  timestamp: string;
  user_name: string;
  event_type: AnalyticsEventType;
  path: string;
  destination?: string;
  search_query?: string;
}

export interface JourneyStep {
  from: string;
  to: string;
  count: number;
}

export interface AnalyticsSession {
  session_id: string;
  user_email: string;
  user_name: string;
  start: string;
  end: string;
  duration_ms: number;
  entry_page: string;
  exit_page: string;
  destinations: string[];
  event_count: number;
}

export interface AnalyticsDashboardDataV2 extends AnalyticsDashboardData {
  comparisons: {
    page_views: PeriodComparison;
    searches: PeriodComparison;
    active_users: PeriodComparison;
    booking_clicks: PeriodComparison;
  };
  heatmap: HeatmapCell[];
  trends: { growing: DestinationTrend[]; declining: DestinationTrend[] };
  engagement: UserEngagement[];
  funnel: FunnelStage[];
  coverage: ContentCoverage[];
  feed: ActivityFeedItem[];
  journeys: JourneyStep[];
  booking_correlation: { slug: string; views: number; clicks: number }[];
  feedback_trend: { date: string; count: number }[];
  daily_views_sparkline: number[];
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

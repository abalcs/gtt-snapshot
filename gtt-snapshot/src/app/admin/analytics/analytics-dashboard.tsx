"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  AnalyticsDashboardDataV2,
  PeriodComparison,
  HeatmapCell,
  DestinationTrend,
  FunnelStage,
  ActivityFeedItem,
  JourneyStep,
  UserEngagement,
  EngagementTier,
} from "@/lib/analytics-types";

// ── Visualization Components ─────────────────────────────

function Sparkline({ data, width = 80, height = 24 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 2) - 1}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline points={points} fill="none" stroke="#3a5f54" strokeWidth="1.5" />
    </svg>
  );
}

function ComparisonArrow({ comparison }: { comparison: PeriodComparison }) {
  const { change_pct } = comparison;
  if (change_pct === 0) return <span className="text-xs text-muted-foreground ml-1">—</span>;
  const isUp = change_pct > 0;
  return (
    <span className={`text-xs font-medium ml-1 ${isUp ? "text-green-600" : "text-red-600"}`}>
      {isUp ? "↑" : "↓"} {Math.abs(change_pct)}%
    </span>
  );
}

function StatCardV2({
  label,
  value,
  comparison,
  sparkData,
  sub,
}: {
  label: string;
  value: string | number;
  comparison?: PeriodComparison;
  sparkData?: number[];
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">{value}</span>
              {comparison && <ComparisonArrow comparison={comparison} />}
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
            {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          {sparkData && sparkData.length > 1 && (
            <Sparkline data={sparkData} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TierBadge({ tier }: { tier: EngagementTier }) {
  const styles: Record<EngagementTier, string> = {
    power: "bg-green-100 text-green-700",
    regular: "bg-blue-100 text-blue-700",
    inactive: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${styles[tier]}`}>
      {tier}
    </span>
  );
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.min((score / Math.max(max, 1)) * 100, 100);
  return (
    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-[#3a5f54] rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ActivityHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const max = Math.max(...cells.map(c => c.value), 1);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Activity heatmap (day × hour)</p>
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Hour labels */}
          <div className="flex ml-8 mb-0.5">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="w-4 text-[8px] text-muted-foreground text-center">
                {i % 6 === 0 ? i : ""}
              </div>
            ))}
          </div>
          {dayLabels.map((day, dayIdx) => (
            <div key={day} className="flex items-center">
              <span className="text-[9px] text-muted-foreground w-8 text-right pr-1">{day}</span>
              {Array.from({ length: 24 }, (_, hour) => {
                const cell = cells.find(c => c.day === dayIdx && c.hour === hour);
                const val = cell?.value ?? 0;
                const intensity = val / max;
                return (
                  <div
                    key={hour}
                    className="w-4 h-4 rounded-[2px] m-[0.5px]"
                    style={{
                      backgroundColor: val === 0
                        ? "hsl(var(--muted))"
                        : `rgba(58, 95, 84, ${0.15 + intensity * 0.85})`,
                    }}
                    title={`${day} ${hour}:00 — ${val} views`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  if (stages.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>;
  return (
    <div className="space-y-2">
      {stages.map((stage, i) => (
        <div key={stage.label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-28 text-right shrink-0">{stage.label}</span>
          <div className="flex-1 flex justify-center">
            <div
              className="h-8 bg-[#3a5f54] rounded-sm flex items-center justify-center transition-all"
              style={{
                width: `${Math.max(stage.pct_of_top, 8)}%`,
                opacity: 1 - i * 0.12,
              }}
            >
              <span className="text-[10px] text-white font-medium">{stage.count}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground w-10 shrink-0">{stage.pct_of_top}%</span>
        </div>
      ))}
    </div>
  );
}

function TrendLines({ trends, label }: { trends: DestinationTrend[]; label: string }) {
  if (trends.length === 0) return <p className="text-sm text-muted-foreground text-center py-2">None</p>;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {trends.map(t => (
          <div key={t.slug} className="flex items-center gap-2">
            <span className="text-xs w-28 truncate text-right shrink-0">{t.slug}</span>
            <Sparkline data={t.daily_views} width={60} height={16} />
            <span className={`text-xs font-medium ${t.change_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
              {t.change_pct >= 0 ? "+" : ""}{t.change_pct}%
            </span>
            <span className="text-[10px] text-muted-foreground">{t.current_views} views</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>;

  const eventIcon: Record<string, string> = {
    page_view: "👁",
    search: "🔍",
    compare: "⚖️",
    help_me_choose: "🎯",
    filter_season: "📅",
    filter_budget: "💰",
    filter_tag: "🏷",
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="max-h-64 overflow-y-auto space-y-1">
      {items.map((item, i) => (
        <div key={`${item.timestamp}-${i}`} className="flex items-center gap-2 py-1 border-b last:border-0">
          <span className="text-sm w-5 text-center">{eventIcon[item.event_type] ?? "•"}</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium">{item.user_name}</span>
            <span className="text-xs text-muted-foreground ml-1">
              {item.event_type === "search" ? `searched "${item.search_query}"` :
               item.event_type === "page_view" && item.destination ? `viewed ${item.destination}` :
               item.event_type === "page_view" ? `visited ${item.path}` :
               item.event_type.replace(/_/g, " ")}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(item.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}

function DateRangePicker({
  range,
  onRangeChange,
}: {
  range: number;
  onRangeChange: (r: number) => void;
}) {
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const presets = [7, 30, 90];

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    const start = new Date(customStart);
    const end = new Date(customEnd);
    const diff = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
    if (diff > 0 && diff <= 365) onRangeChange(diff);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {presets.map(d => (
        <button
          key={d}
          onClick={() => onRangeChange(d)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            range === d
              ? "bg-[#3a5f54] text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {d}d
        </button>
      ))}
      <span className="text-xs text-muted-foreground mx-1">|</span>
      <input
        type="date"
        value={customStart}
        onChange={e => setCustomStart(e.target.value)}
        className="text-xs border rounded px-1.5 py-1 w-28"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <input
        type="date"
        value={customEnd}
        onChange={e => setCustomEnd(e.target.value)}
        className="text-xs border rounded px-1.5 py-1 w-28"
      />
      <button
        onClick={applyCustom}
        className="px-2 py-1 text-xs bg-muted text-muted-foreground hover:bg-muted/80 rounded-md"
      >
        Apply
      </button>
    </div>
  );
}

// ── Existing Components (kept) ───────────────────────────

function BarChart({ data, maxBars = 20 }: { data: { label: string; value: number }[]; maxBars?: number }) {
  const items = data.slice(0, maxBars);
  const max = Math.max(...items.map(d => d.value), 1);
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-28 truncate text-right shrink-0">{item.label}</span>
          <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
            <div
              className="h-full bg-[#3a5f54] rounded-sm transition-all"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium w-10 text-right shrink-0">{item.value}</span>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
      )}
    </div>
  );
}

function HourlyStrip({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 1);
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Activity by hour</p>
      <div className="flex gap-px h-12">
        {hours.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end" title={`${i}:00 — ${count} views`}>
            <div
              className="bg-[#3a5f54]/70 rounded-t-sm min-h-[2px]"
              style={{ height: `${(count / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-muted-foreground">12am</span>
        <span className="text-[9px] text-muted-foreground">6am</span>
        <span className="text-[9px] text-muted-foreground">12pm</span>
        <span className="text-[9px] text-muted-foreground">6pm</span>
        <span className="text-[9px] text-muted-foreground">12am</span>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsDashboardDataV2 | null>(null);
  const [range, setRange] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    fetch(`/api/admin/analytics?v=2&range=${range}`)
      .then(res => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(d => {
        if (d && d.overview) setData(d);
        else setData(null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range, mounted]);

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const res = await fetch("/api/admin/analytics/cleanup", { method: "POST" });
      const result = await res.json();
      alert(`Cleaned up ${result.deleted} old event documents.`);
    } catch {
      alert("Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  const handleExport = () => {
    window.open(`/api/admin/analytics/export?tab=${activeTab}&range=${range}`, "_blank");
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <svg className="animate-spin h-5 w-5 text-[#3a5f54]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-muted-foreground py-8">Failed to load analytics data.</p>;
  }

  const tierCounts = { power: 0, regular: 0, inactive: 0 };
  (data.engagement ?? []).forEach(u => { tierCounts[u.tier]++; });
  const maxScore = Math.max(...(data.engagement ?? []).map(u => u.engagement_score), 1);

  return (
    <div className="space-y-6">
      {/* Header: Date picker + Export + Cleanup */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <DateRangePicker range={range} onRangeChange={setRange} />
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#3a5f54] text-white hover:bg-[#2e4d43] transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50"
          >
            {cleaning ? "Cleaning..." : "Cleanup old events (90d+)"}
          </button>
        </div>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="searches">Searches</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        {/* ── Overview ──────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCardV2
              label="Active Users"
              value={data.comparisons?.active_users?.current ?? data.overview.active_users_today}
              comparison={data.comparisons?.active_users}
              sparkData={data.daily_views_sparkline}
            />
            <StatCardV2
              label={`Page Views (${range}d)`}
              value={data.comparisons?.page_views?.current ?? data.overview.page_views_7d}
              comparison={data.comparisons?.page_views}
              sparkData={data.daily_views_sparkline}
            />
            <StatCardV2
              label={`Searches (${range}d)`}
              value={data.comparisons?.searches?.current ?? data.overview.searches_7d}
              comparison={data.comparisons?.searches}
            />
            <StatCardV2
              label="Booking Clicks"
              value={data.comparisons?.booking_clicks?.current ?? 0}
              comparison={data.comparisons?.booking_clicks}
              sub={data.overview.top_destination ? `Top: ${data.overview.top_destination.slug}` : undefined}
            />
          </div>

          {/* Heatmap */}
          {data.heatmap && data.heatmap.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <ActivityHeatmap cells={data.heatmap} />
              </CardContent>
            </Card>
          )}

          {/* Trends */}
          {data.trends && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Growing Destinations</CardTitle></CardHeader>
                <CardContent>
                  <TrendLines trends={data.trends.growing} label="Top gainers vs previous period" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Declining Destinations</CardTitle></CardHeader>
                <CardContent>
                  <TrendLines trends={data.trends.declining} label="Biggest drops vs previous period" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Funnel */}
          {data.funnel && data.funnel.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
              <CardContent>
                <FunnelChart stages={data.funnel} />
              </CardContent>
            </Card>
          )}

          {/* Activity Feed */}
          {data.feed && (
            <Card>
              <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
              <CardContent>
                <ActivityFeed items={data.feed} />
              </CardContent>
            </Card>
          )}

          {/* Daily views + hourly (existing) */}
          <Card>
            <CardHeader><CardTitle>Daily Page Views</CardTitle></CardHeader>
            <CardContent>
              <BarChart
                data={data.overview.daily_views.map(d => ({
                  label: d.date.slice(5),
                  value: d.views,
                }))}
                maxBars={range}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <HourlyStrip hours={data.overview.hourly_views} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users ─────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
          {/* Tier summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-green-600">{tierCounts.power}</div>
                <p className="text-xs text-muted-foreground">Power Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{tierCounts.regular}</div>
                <p className="text-xs text-muted-foreground">Regular Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-gray-400">{tierCounts.inactive}</div>
                <p className="text-xs text-muted-foreground">Inactive Users</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>User Engagement</CardTitle></CardHeader>
            <CardContent>
              {(data.engagement ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No user data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Name</th>
                        <th className="py-2 pr-4 font-medium">Tier</th>
                        <th className="py-2 pr-4 font-medium text-right">Score</th>
                        <th className="py-2 pr-4 font-medium">Last Active</th>
                        <th className="py-2 pr-4 font-medium text-right">Views</th>
                        <th className="py-2 pr-4 font-medium text-right">Active Days</th>
                        <th className="py-2 font-medium">Top Destination</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.engagement ?? []).map(u => (
                        <tr key={u.email} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="py-2 pr-4">
                            <TierBadge tier={u.tier} />
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2 justify-end">
                              <ScoreBar score={u.engagement_score} max={maxScore} />
                              <span className="text-xs w-6 text-right">{u.engagement_score}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {u.last_active ? new Date(u.last_active).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-2 pr-4 text-right">{u.page_views_30d}</td>
                          <td className="py-2 pr-4 text-right">{u.active_days_count}</td>
                          <td className="py-2 text-muted-foreground">{u.top_destination ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pages ─────────────────────────────── */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Top Destinations by Views</CardTitle></CardHeader>
            <CardContent>
              <BarChart
                data={data.pages.map(p => ({ label: p.slug, value: p.views }))}
              />
            </CardContent>
          </Card>

          {/* Booking correlation */}
          {data.booking_correlation && data.booking_correlation.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Views vs Booking Clicks</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {data.booking_correlation.map(d => {
                    const maxV = Math.max(...data.booking_correlation.map(x => x.views), 1);
                    const maxC = Math.max(...data.booking_correlation.map(x => x.clicks), 1);
                    return (
                      <div key={d.slug} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-28 truncate text-right shrink-0">{d.slug}</span>
                        <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden relative">
                          <div
                            className="absolute top-0 left-0 h-full bg-[#3a5f54]/30 rounded-sm"
                            style={{ width: `${(d.views / maxV) * 100}%` }}
                          />
                          <div
                            className="absolute top-0 left-0 h-full bg-[#3a5f54] rounded-sm"
                            style={{ width: `${(d.clicks / maxC) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-20 text-right shrink-0">
                          {d.views}v / {d.clicks}c
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#3a5f54]/30 rounded-sm inline-block" /> Views</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#3a5f54] rounded-sm inline-block" /> Clicks</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content coverage gaps */}
          {data.coverage && data.coverage.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Content Coverage Gaps</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">Destinations with fewest views in the last {range} days</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Destination</th>
                        <th className="py-2 pr-4 font-medium">Region</th>
                        <th className="py-2 pr-4 font-medium text-right">Views</th>
                        <th className="py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.coverage.slice(0, 15).map(d => (
                        <tr key={d.slug} className={`border-b last:border-0 ${d.views_30d === 0 ? "bg-red-50" : ""}`}>
                          <td className="py-1.5 pr-4">
                            <span className="font-medium">{d.name}</span>
                            <span className="text-xs text-muted-foreground ml-1">({d.slug})</span>
                          </td>
                          <td className="py-1.5 pr-4 text-muted-foreground">{d.region}</td>
                          <td className={`py-1.5 pr-4 text-right ${d.views_30d === 0 ? "text-red-600 font-medium" : ""}`}>
                            {d.views_30d}
                          </td>
                          <td className="py-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              d.status === "active" ? "bg-green-100 text-green-700" :
                              d.status === "stop_sell" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Searches ──────────────────────────── */}
        <TabsContent value="searches">
          <Card>
            <CardHeader><CardTitle>Search Terms</CardTitle></CardHeader>
            <CardContent>
              {data.searches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No search data yet</p>
              ) : (
                <div className="space-y-1.5">
                  {data.searches.map(s => (
                    <div key={s.query} className="flex items-center gap-2">
                      <span className={`text-xs w-32 truncate text-right shrink-0 ${s.zero_results ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {s.query}
                        {s.zero_results && " (0 results)"}
                      </span>
                      <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                        <div
                          className={`h-full rounded-sm ${s.zero_results ? "bg-red-400" : "bg-[#3a5f54]"}`}
                          style={{ width: `${(s.count / Math.max(...data.searches.map(x => x.count), 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right shrink-0">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Features ──────────────────────────── */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Feature Usage</CardTitle></CardHeader>
            <CardContent>
              <BarChart
                data={data.features.map(f => ({ label: f.name.replace(/_/g, " "), value: f.count }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Popular Filters</CardTitle></CardHeader>
            <CardContent>
              <BarChart
                data={data.filters.map(f => ({ label: f.key, value: f.count }))}
              />
            </CardContent>
          </Card>

          {/* Journey flows */}
          {data.journeys && data.journeys.length > 0 && (
            <Card>
              <CardHeader><CardTitle>User Journey Flows</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">Most common event transitions</p>
                <div className="space-y-1">
                  {data.journeys.map((j, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground w-28 text-center truncate">
                        {j.from.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground w-28 text-center truncate">
                        {j.to.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium ml-1">{j.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback trend */}
          {data.feedback_trend && data.feedback_trend.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Feedback Submissions</CardTitle></CardHeader>
              <CardContent>
                <BarChart
                  data={data.feedback_trend.map(d => ({ label: d.date.slice(5), value: d.count }))}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

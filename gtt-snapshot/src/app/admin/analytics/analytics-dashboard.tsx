"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { AnalyticsDashboardData } from "@/lib/analytics-types";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

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

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    fetch(`/api/admin/analytics?range=${range}`)
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

  return (
    <div className="space-y-6">
      {/* Range selector + cleanup */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                range === d
                  ? "bg-[#3a5f54] text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <button
          onClick={handleCleanup}
          disabled={cleaning}
          className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50"
        >
          {cleaning ? "Cleaning..." : "Cleanup old events (90d+)"}
        </button>
      </div>

      <Tabs defaultValue="overview">
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
            <StatCard label="Active Users Today" value={data.overview.active_users_today} />
            <StatCard label={`Page Views (${range}d)`} value={data.overview.page_views_7d} />
            <StatCard label={`Searches (${range}d)`} value={data.overview.searches_7d} />
            <StatCard
              label="Top Destination"
              value={data.overview.top_destination?.slug ?? "—"}
              sub={data.overview.top_destination ? `${data.overview.top_destination.count} views` : undefined}
            />
          </div>

          <Card>
            <CardHeader><CardTitle>Daily Page Views</CardTitle></CardHeader>
            <CardContent>
              <BarChart
                data={data.overview.daily_views.map(d => ({
                  label: d.date.slice(5), // "07-14"
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
        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle>User Activity</CardTitle></CardHeader>
            <CardContent>
              {data.users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No user data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Name</th>
                        <th className="py-2 pr-4 font-medium">Last Active</th>
                        <th className="py-2 pr-4 font-medium text-right">Views</th>
                        <th className="py-2 pr-4 font-medium text-right">Active Days</th>
                        <th className="py-2 font-medium">Top Destination</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map(u => (
                        <tr key={u.email} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
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
        <TabsContent value="pages">
          <Card>
            <CardHeader><CardTitle>Top Destinations by Views</CardTitle></CardHeader>
            <CardContent>
              <BarChart
                data={data.pages.map(p => ({ label: p.slug, value: p.views }))}
              />
            </CardContent>
          </Card>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

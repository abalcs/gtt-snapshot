"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import type { TravelData } from "@/lib/types";

interface SyncResult {
  count: number;
  errors: string[];
}

function advisoryBadge(level: number | null) {
  if (level === null) return <Badge variant="outline">No data</Badge>;
  const colors: Record<number, string> = {
    1: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
    2: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30",
    3: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300 border-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
    4: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
  };
  const labels: Record<number, string> = {
    1: "Exercise Normal Precautions",
    2: "Exercise Increased Caution",
    3: "Reconsider Travel",
    4: "Do Not Travel",
  };
  return (
    <Badge variant="outline" className={colors[level] || ""}>
      Level {level}: {labels[level] || "Unknown"}
    </Badge>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

export function TravelDataManagement({ initialData }: { initialData: TravelData[] }) {
  const [data, setData] = useState(initialData);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, SyncResult | null>>({});
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [search, setSearch] = useState("");

  async function postSync(type: string, codes?: string[]) {
    const qs = codes ? `?type=${type}&codes=${codes.join(",")}` : `?type=${type}`;
    const res = await fetch(`/api/admin/sync-travel-data${qs}`, { method: "POST" });
    let json: { error?: string; results?: Record<string, SyncResult> } = {};
    try {
      json = await res.json();
    } catch {
      // A timed-out request returns an HTML error page, not JSON
    }
    if (!res.ok) throw new Error(json.error || `Sync failed (HTTP ${res.status})`);
    return json.results ?? {};
  }

  async function refreshData() {
    try {
      const res = await fetch("/api/admin/sync-travel-data");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) setData(json.data);
      }
    } catch {
      // Keep showing the previous data if the refresh fails
    }
  }

  async function handleSync(type: string) {
    setSyncing(prev => ({ ...prev, [type]: true }));
    setError("");
    setProgress("");

    try {
      if (type === "health" || type === "all") {
        if (type === "all") {
          const adv = await postSync("advisories");
          setResults(prev => ({ ...prev, ...adv }));
          const visa = await postSync("visa");
          setResults(prev => ({ ...prev, ...visa }));
        }
        // Health runs in chunks of 25 countries per request, so no single
        // request can time out the way the old all-in-one sync did.
        const codes = data.map(td => td.country_code).filter(Boolean);
        if (codes.length === 0) {
          const h = await postSync("health");
          setResults(prev => ({ ...prev, ...h }));
        } else {
          const CHUNK = 25;
          let total = 0;
          const errs: string[] = [];
          for (let i = 0; i < codes.length; i += CHUNK) {
            const slice = codes.slice(i, i + CHUNK);
            setProgress(`Health data: ${Math.min(i + CHUNK, codes.length)} of ${codes.length} countries`);
            const r = await postSync("health", slice);
            if (r.health) {
              total += r.health.count;
              errs.push(...r.health.errors);
            }
          }
          setResults(prev => ({ ...prev, health: { count: total, errors: errs } }));
        }
      } else {
        const r = await postSync(type);
        setResults(prev => ({ ...prev, ...r }));
      }
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setProgress("");
      setSyncing(prev => ({ ...prev, [type]: false }));
    }
  }

  const filtered = data.filter(td => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      td.country_code.toLowerCase().includes(q) ||
      td.country_name.toLowerCase().includes(q)
    );
  });

  // Find most recent sync timestamps across all data
  const latestAdvisorySync = data.reduce((latest, td) => {
    if (td.advisory_synced_at && (!latest || td.advisory_synced_at > latest)) return td.advisory_synced_at;
    return latest;
  }, null as string | null);

  const latestVisaSync = data.reduce((latest, td) => {
    if (td.visa_synced_at && (!latest || td.visa_synced_at > latest)) return td.visa_synced_at;
    return latest;
  }, null as string | null);

  const latestHealthSync = data.reduce((latest, td) => {
    if (td.health_synced_at && (!latest || td.health_synced_at > latest)) return td.health_synced_at;
    return latest;
  }, null as string | null);

  const anySyncing = Object.values(syncing).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Travel Advisories</h3>
              <p className="text-xs text-muted-foreground">US State Dept advisory levels & entry/exit info</p>
              <p className="text-xs">Last sync: {formatDate(latestAdvisorySync)}</p>
              <Button
                size="sm"
                onClick={() => handleSync("advisories")}
                disabled={anySyncing}
              >
                {syncing.advisories ? "Syncing..." : "Sync Advisories"}
              </Button>
              {results.advisories && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Updated {results.advisories.count} countries
                  {results.advisories.errors.length > 0 && (
                    <span className="text-red-600"> ({results.advisories.errors.length} errors)</span>
                  )}
                </p>
              )}
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Visa Requirements</h3>
              <p className="text-xs text-muted-foreground">Passport Index dataset (US passport holders)</p>
              <p className="text-xs">Last sync: {formatDate(latestVisaSync)}</p>
              <Button
                size="sm"
                onClick={() => handleSync("visa")}
                disabled={anySyncing}
              >
                {syncing.visa ? "Syncing..." : "Sync Visa"}
              </Button>
              {results.visa && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Updated {results.visa.count} countries
                  {results.visa.errors.length > 0 && (
                    <span className="text-red-600"> ({results.visa.errors.length} errors)</span>
                  )}
                </p>
              )}
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Health Data</h3>
              <p className="text-xs text-muted-foreground">CDC Travelers' Health vaccine & malaria data</p>
              <p className="text-xs">Last sync: {formatDate(latestHealthSync)}</p>
              <Button
                size="sm"
                onClick={() => handleSync("health")}
                disabled={anySyncing}
              >
                {syncing.health ? "Syncing..." : "Sync Health"}
              </Button>
              {results.health && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Updated {results.health.count} countries
                  {results.health.errors.length > 0 && (
                    <span className="text-red-600"> ({results.health.errors.length} errors)</span>
                  )}
                </p>
              )}
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Sync All</h3>
              <p className="text-xs text-muted-foreground">Run all sync operations sequentially</p>
              <p className="text-xs">&nbsp;</p>
              <Button
                size="sm"
                onClick={() => handleSync("all")}
                disabled={anySyncing}
              >
                {syncing.all ? "Syncing All..." : "Sync All"}
              </Button>
            </div>
          </div>

          {progress && (
            <p className="text-xs text-muted-foreground">Syncing... {progress}</p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10 rounded p-2">{error}</p>
          )}

          {/* Show detailed errors from sync */}
          {Object.entries(results).map(([type, result]) => {
            if (!result?.errors.length) return null;
            return (
              <div key={type} className="text-xs text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10 rounded p-2">
                <p className="font-semibold">{type} errors:</p>
                {result.errors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Travel Data ({data.length} countries)</CardTitle>
            <Input
              placeholder="Search countries..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>}
              heading={data.length === 0 ? "No travel data synced yet" : "No matching countries"}
              description={data.length === 0 ? "Click a sync button above to get started." : "Try a different search term."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Code</th>
                    <th className="text-left py-2 px-2 font-medium">Country</th>
                    <th className="text-left py-2 px-2 font-medium">Advisory</th>
                    <th className="text-left py-2 px-2 font-medium">Visa</th>
                    <th className="text-left py-2 px-2 font-medium">Health</th>
                    <th className="text-left py-2 px-2 font-medium">Last Synced</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(td => (
                    <tr key={td.country_code} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-mono text-xs">{td.country_code}</td>
                      <td className="py-2 px-2">{td.country_name || "—"}</td>
                      <td className="py-2 px-2">{advisoryBadge(td.advisory_level)}</td>
                      <td className="py-2 px-2">
                        {td.visa_status ? (
                          <Badge variant="outline" className="capitalize">
                            {td.visa_status}
                            {td.visa_max_days ? ` (${td.visa_max_days}d)` : ""}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No data</Badge>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {td.health_synced_at ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            {td.health_vaccines_required.length + td.health_vaccines_recommended.length} vaccines
                          </Badge>
                        ) : (
                          <Badge variant="outline">No data</Badge>
                        )}
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {formatDate(td.synced_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

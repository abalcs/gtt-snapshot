"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface StopSellEntry {
  slug: string;
  name: string;
  region_name: string;
  urgency: string | null;
  status: string;
  stop_sell_expires: string | null;
  stop_sell_note: string | null;
}

type FilterType = "all" | "expired" | "expiring_soon" | "active" | "no_date";

function getExpirationStatus(expires: string | null): "expired" | "expiring_soon" | "active" | "no_date" {
  if (!expires) return "no_date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(expires + "T00:00:00");
  const diffMs = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 14) return "expiring_soon";
  return "active";
}

function getCountdownText(expires: string | null): string {
  if (!expires) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(expires + "T00:00:00");
  const diffMs = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} ago`;
  if (diffDays === 0) return "Expires today";
  return `Expires in ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
}

function StatusBadge({ status }: { status: "expired" | "expiring_soon" | "active" | "no_date" }) {
  const styles = {
    expired: "bg-red-100 text-red-800 border-red-200",
    expiring_soon: "bg-amber-100 text-amber-800 border-amber-200",
    active: "bg-green-100 text-green-800 border-green-200",
    no_date: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const labels = {
    expired: "Expired",
    expiring_soon: "Expiring Soon",
    active: "Active",
    no_date: "No Date",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function StopSellManagement() {
  const [entries, setEntries] = useState<StopSellEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ stop_sell_expires: "", stop_sell_note: "", urgency: "" });
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stop-sells");
      const data = await res.json();
      setEntries(data.destinations || []);
    } catch {
      console.error("Failed to fetch stop sells");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const counts = {
    expired: entries.filter((e) => getExpirationStatus(e.stop_sell_expires) === "expired").length,
    expiring_soon: entries.filter((e) => getExpirationStatus(e.stop_sell_expires) === "expiring_soon").length,
    active: entries.filter((e) => getExpirationStatus(e.stop_sell_expires) === "active").length,
    no_date: entries.filter((e) => getExpirationStatus(e.stop_sell_expires) === "no_date").length,
  };

  const filtered = filter === "all" ? entries : entries.filter((e) => getExpirationStatus(e.stop_sell_expires) === filter);

  const openEdit = (entry: StopSellEntry) => {
    setEditSlug(entry.slug);
    setEditForm({
      stop_sell_expires: entry.stop_sell_expires || "",
      stop_sell_note: entry.stop_sell_note || "",
      urgency: entry.urgency || "",
    });
  };

  const saveEdit = async () => {
    if (!editSlug) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/stop-sells", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editSlug,
          stop_sell_expires: editForm.stop_sell_expires || null,
          stop_sell_note: editForm.stop_sell_note || null,
          urgency: editForm.urgency || null,
        }),
      });
      if (res.ok) {
        setEditSlug(null);
        await fetchEntries();
      }
    } finally {
      setSaving(false);
    }
  };

  const clearExpired = async () => {
    if (!confirm(`Clear all ${counts.expired} expired stop sells? This will remove their expiration dates, notes, and urgency text.`)) return;
    setClearing(true);
    try {
      const res = await fetch("/api/admin/stop-sells", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-expired" }),
      });
      if (res.ok) {
        await fetchEntries();
      }
    } finally {
      setClearing(false);
    }
  };

  const extendDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setEditForm((prev) => ({ ...prev, stop_sell_expires: date.toISOString().split("T")[0] }));
  };

  const clearStopSell = () => {
    setEditForm({ stop_sell_expires: "", stop_sell_note: "", urgency: "" });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-muted-foreground">Loading stop sells...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-8 py-6 shadow-[var(--shadow-md)]">
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Stop Sell Management</h1>
            <p className="text-red-100">{entries.length} destinations with stop sells or urgency alerts</p>
          </div>
          <div className="flex gap-2">
            {counts.expired > 0 && (
              <Button
                onClick={clearExpired}
                disabled={clearing}
                className="bg-white text-red-700 hover:bg-white/90"
              >
                {clearing ? "Clearing..." : `Clear ${counts.expired} Expired`}
              </Button>
            )}
            <Link href="/admin">
              <Button variant="outline" className="bg-white/90 hover:bg-white border-white/30">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { key: "expired" as const, label: "Expired", color: "border-red-300 bg-red-50", textColor: "text-red-700", countColor: "text-red-800" },
          { key: "expiring_soon" as const, label: "Expiring Soon", color: "border-amber-300 bg-amber-50", textColor: "text-amber-700", countColor: "text-amber-800" },
          { key: "active" as const, label: "Active", color: "border-green-300 bg-green-50", textColor: "text-green-700", countColor: "text-green-800" },
          { key: "no_date" as const, label: "No Date Set", color: "border-gray-300 bg-gray-50", textColor: "text-gray-600", countColor: "text-gray-800" },
        ]).map(({ key, label, color, textColor, countColor }) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? "all" : key)}
            className={`rounded-lg border p-3 text-left transition-all ${
              filter === key ? `${color} ring-2 ring-offset-1 ring-current` : `${color} hover:shadow-sm`
            }`}
          >
            <div className={`text-2xl font-bold ${countColor}`}>{counts[key]}</div>
            <div className={`text-xs font-medium ${textColor}`}>{label}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {filter === "all" ? "All Stop Sells" : filter.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              {" "}({filtered.length})
            </span>
            {filter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>Show All</Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No entries in this category.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Destination</th>
                    <th className="pb-2 font-medium">Region</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Expires</th>
                    <th className="pb-2 font-medium">Countdown</th>
                    <th className="pb-2 font-medium">Urgency</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => {
                    const expStatus = getExpirationStatus(entry.stop_sell_expires);
                    return (
                      <tr key={entry.slug} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="py-2.5 pr-3">
                          <Link href={`/destinations/${entry.slug}`} className="font-medium text-[#3a5f54] hover:underline">
                            {entry.name}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{entry.region_name}</td>
                        <td className="py-2.5 pr-3">
                          <StatusBadge status={expStatus} />
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          {entry.stop_sell_expires || <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          {entry.stop_sell_expires ? (
                            <span className={expStatus === "expired" ? "text-red-600 font-medium" : expStatus === "expiring_soon" ? "text-amber-600 font-medium" : "text-green-600"}>
                              {getCountdownText(entry.stop_sell_expires)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 max-w-48">
                          {entry.urgency ? (
                            <span className="text-muted-foreground truncate block" title={entry.urgency}>
                              {entry.urgency.length > 60 ? entry.urgency.slice(0, 60) + "..." : entry.urgency}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <Button variant="outline" size="sm" onClick={() => openEdit(entry)}>Edit</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      {editSlug && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50" onClick={() => setEditSlug(null)}>
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">
              Edit Stop Sell — {entries.find((e) => e.slug === editSlug)?.name}
            </h2>

            <div>
              <Label htmlFor="edit-expires">Expiration Date</Label>
              <Input
                id="edit-expires"
                type="date"
                value={editForm.stop_sell_expires}
                onChange={(e) => setEditForm((prev) => ({ ...prev, stop_sell_expires: e.target.value }))}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => extendDate(30)}>Extend 30 Days</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => extendDate(90)}>Extend 90 Days</Button>
              <Button type="button" variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={clearStopSell}>Clear Stop Sell</Button>
            </div>

            <div>
              <Label htmlFor="edit-note">Stop Sell Note</Label>
              <Textarea
                id="edit-note"
                value={editForm.stop_sell_note}
                onChange={(e) => setEditForm((prev) => ({ ...prev, stop_sell_note: e.target.value }))}
                rows={2}
                placeholder="Reason for stop sell..."
              />
            </div>

            <div>
              <Label htmlFor="edit-urgency">Urgency Text</Label>
              <Textarea
                id="edit-urgency"
                value={editForm.urgency}
                onChange={(e) => setEditForm((prev) => ({ ...prev, urgency: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditSlug(null)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

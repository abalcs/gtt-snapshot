"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SpecialistEntry {
  id?: string;
  interest: string;
  region: string;
  specialists: string[];
}

const REGION_COLORS: Record<string, string> = {
  "Africa": "bg-amber-50 text-amber-700 border-amber-200",
  "Asia": "bg-rose-50 text-rose-700 border-rose-200",
  "Australasia & Pacific": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Europe": "bg-blue-50 text-blue-700 border-blue-200",
  "Latin America & Caribbean": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Middle East & North Africa": "bg-orange-50 text-orange-700 border-orange-200",
  "UK & Ireland": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Iberia & Turkey": "bg-purple-50 text-purple-700 border-purple-200",
  "USA & Canada": "bg-slate-50 text-slate-700 border-slate-200",
};

export function SpecialistAssignmentsAdmin() {
  const [entries, setEntries] = useState<SpecialistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<SpecialistEntry | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/specialist-assignments");
      const data = await res.json();
      setEntries(data.entries || []);
      setSeeded(data.entries?.length > 0 && data.entries[0].id);
    } catch {
      console.error("Failed to fetch specialist assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSeed = async () => {
    if (!confirm("This will copy all hardcoded specialist data to Firestore so it can be edited. Continue?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/specialist-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      if (res.ok) {
        await fetchEntries();
      }
    } finally {
      setSeeding(false);
    }
  };

  const openEdit = (entry: SpecialistEntry) => {
    setEditEntry(entry);
    setEditText(entry.specialists.join("\n"));
  };

  const saveEdit = async () => {
    if (!editEntry?.id) return;
    setSaving(true);
    try {
      const specialists = editText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/specialist-assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editEntry.id, specialists }),
      });
      if (res.ok) {
        setEditEntry(null);
        await fetchEntries();
      }
    } finally {
      setSaving(false);
    }
  };

  const regions = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.region));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let results = entries;
    if (activeRegion) {
      results = results.filter((e) => e.region === activeRegion);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (e) =>
          e.interest.toLowerCase().includes(q) ||
          e.specialists.some((s) => s.toLowerCase().includes(q))
      );
    }
    return results;
  }, [entries, activeRegion, search]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-muted-foreground">Loading specialist assignments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#3a5f54] via-[#2d5246] to-[#1e3830] px-8 py-6 shadow-[var(--shadow-md)]">
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Country Specialist Assignments</h1>
            <p className="text-white/70">{entries.length} destinations · Edit which specialists sell each country</p>
          </div>
          <div className="flex gap-2">
            {!seeded && (
              <Button onClick={handleSeed} disabled={seeding} className="bg-white text-[#3a5f54] hover:bg-white/90">
                {seeding ? "Seeding..." : "Seed to Firestore"}
              </Button>
            )}
            <Link href="/admin">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border-white/30">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search & filters */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search by country or specialist name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3a5f54]/30"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveRegion(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeRegion === null ? "bg-[#3a5f54] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({entries.length})
          </button>
          {regions.map((region) => {
            const count = entries.filter((e) => e.region === region).length;
            return (
              <button
                key={region}
                onClick={() => setActiveRegion(activeRegion === region ? null : region)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeRegion === region
                    ? "bg-[#3a5f54] text-white border-[#3a5f54]"
                    : REGION_COLORS[region] || "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {region} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((entry) => (
          <Card key={entry.id || entry.interest} className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm">{entry.interest}</CardTitle>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border ${REGION_COLORS[entry.region] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {entry.region}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-0.5 mb-3">
                {entry.specialists.map((name, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{name}</li>
                ))}
              </ul>
              {entry.id && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(entry)}>
                  Edit Specialists
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">No results found.</p>
      )}

      {/* Edit modal */}
      {editEntry && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50" onClick={() => setEditEntry(null)}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold">Edit Specialists — {editEntry.interest}</h2>
              <p className="text-sm text-muted-foreground">One specialist per line. Include annotations in parentheses if needed (e.g. &quot;Tom Smith (trained)&quot;).</p>

              <div>
                <Label htmlFor="edit-specialists">Specialists</Label>
                <Textarea
                  id="edit-specialists"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={Math.max(6, editEntry.specialists.length + 2)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

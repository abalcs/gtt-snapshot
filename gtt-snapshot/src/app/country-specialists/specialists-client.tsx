"use client";

import { useState, useMemo } from "react";
import { SPECIALIST_DATA, SPECIALIST_REGIONS } from "@/lib/specialist-data";

function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(${escaped})`, "gi"),
    '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>'
  );
}

const REGION_COLORS: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
  "Africa": { bg: "bg-amber-50", text: "text-amber-700", activeBg: "bg-amber-600", activeText: "text-white" },
  "Asia": { bg: "bg-rose-50", text: "text-rose-700", activeBg: "bg-rose-600", activeText: "text-white" },
  "Australasia & Pacific": { bg: "bg-cyan-50", text: "text-cyan-700", activeBg: "bg-cyan-600", activeText: "text-white" },
  "Europe": { bg: "bg-blue-50", text: "text-blue-700", activeBg: "bg-blue-600", activeText: "text-white" },
  "Latin America & Caribbean": { bg: "bg-emerald-50", text: "text-emerald-700", activeBg: "bg-emerald-600", activeText: "text-white" },
  "Middle East & North Africa": { bg: "bg-orange-50", text: "text-orange-700", activeBg: "bg-orange-600", activeText: "text-white" },
  "UK & Ireland": { bg: "bg-indigo-50", text: "text-indigo-700", activeBg: "bg-indigo-600", activeText: "text-white" },
  "Iberia & Turkey": { bg: "bg-purple-50", text: "text-purple-700", activeBg: "bg-purple-600", activeText: "text-white" },
  "USA & Canada": { bg: "bg-slate-50", text: "text-slate-700", activeBg: "bg-slate-600", activeText: "text-white" },
};

export function SpecialistsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let results = SPECIALIST_DATA;

    if (activeRegion) {
      results = results.filter((e) => e.region === activeRegion);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (e) =>
          e.interest.toLowerCase().includes(q) ||
          e.specialists.some((s) => s.toLowerCase().includes(q))
      );
    }

    return results;
  }, [searchQuery, activeRegion]);

  // Count unique specialists across all matching entries
  const specialistCount = useMemo(() => {
    const names = new Set<string>();
    filtered.forEach((e) =>
      e.specialists.forEach((s) => {
        const name = s.replace(/\s*\(.*?\)\s*/g, "").trim();
        if (name && !name.startsWith("(") && !name.startsWith("Any") && !name.startsWith("RSM:") && !name.startsWith("Taipei")) {
          names.add(name.toLowerCase());
        }
      })
    );
    return names.size;
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search by country or specialist name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3a5f54]/30 focus:border-[#3a5f54]"
        />
      </div>

      {/* Region filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveRegion(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeRegion === null
              ? "bg-[#3a5f54] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Regions
        </button>
        {SPECIALIST_REGIONS.map((region) => {
          const colors = REGION_COLORS[region];
          const isActive = activeRegion === region;
          return (
            <button
              key={region}
              onClick={() => setActiveRegion(isActive ? null : region)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? `${colors.activeBg} ${colors.activeText}`
                  : `${colors.bg} ${colors.text} hover:opacity-80`
              }`}
            >
              {region}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} destination{filtered.length !== 1 ? "s" : ""} · {specialistCount} specialist{specialistCount !== 1 ? "s" : ""}
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm mt-1">Try adjusting your search or region filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((entry) => {
            const colors = REGION_COLORS[entry.region] || REGION_COLORS["Europe"];
            return (
              <div
                key={entry.interest}
                className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3
                    className="font-semibold text-sm"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(entry.interest, searchQuery),
                    }}
                  />
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}
                  >
                    {entry.region}
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {entry.specialists.map((name, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(name, searchQuery),
                      }}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

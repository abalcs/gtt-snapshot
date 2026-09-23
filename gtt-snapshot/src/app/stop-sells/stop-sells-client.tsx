"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { StopSellEntry } from "./page";

const DEPARTMENTS = ["All", "ESE", "WEMEA", "CANAL", "Asia"] as const;

type StatusFilter = "all" | "expired" | "expiring_soon" | "active" | "no_date";

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
    no_date: "Urgency Notes",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function DetailModal({ entry, onClose }: { entry: StopSellEntry; onClose: () => void }) {
  const expStatus = getExpirationStatus(entry.stop_sell_expires);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{entry.name}</h2>
              <p className="text-sm text-gray-500">{entry.region_name} &middot; {entry.department}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={expStatus} />
              {entry.stop_sell_expires && (
                <span className="text-sm text-gray-500">
                  {getCountdownText(entry.stop_sell_expires)}
                </span>
              )}
            </div>

            {entry.stop_sell_note && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Stop Sell Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.stop_sell_note}</p>
              </div>
            )}

            {entry.urgency && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Urgency Alert</h3>
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed">{entry.urgency}</p>
                </div>
              </div>
            )}

            {!entry.stop_sell_note && !entry.urgency && (
              <p className="text-sm text-gray-400 italic">No notes available for this destination.</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-6 py-4">
            <Link
              href={`/destinations/${entry.slug}`}
              className="text-sm font-medium text-[#3a5f54] hover:underline"
            >
              View destination page &rarr;
            </Link>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function StopSellsClient({ entries }: { entries: StopSellEntry[] }) {
  const [activeDept, setActiveDept] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedEntry, setSelectedEntry] = useState<StopSellEntry | null>(null);

  // Apply department filter first
  const deptFiltered = activeDept === "All" ? entries : entries.filter((e) => e.department === activeDept);

  // Compute status counts from department-filtered entries
  const counts = {
    expired: deptFiltered.filter((e) => getExpirationStatus(e.stop_sell_expires) === "expired").length,
    expiring_soon: deptFiltered.filter((e) => getExpirationStatus(e.stop_sell_expires) === "expiring_soon").length,
    active: deptFiltered.filter((e) => getExpirationStatus(e.stop_sell_expires) === "active").length,
    no_date: deptFiltered.filter((e) => getExpirationStatus(e.stop_sell_expires) === "no_date").length,
  };

  // Apply status filter
  const filtered = statusFilter === "all"
    ? deptFiltered
    : deptFiltered.filter((e) => getExpirationStatus(e.stop_sell_expires) === statusFilter);

  const deptCounts = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = dept === "All" ? entries.length : entries.filter((e) => e.department === dept).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Summary count cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { key: "expired" as const, label: "Expired", color: "border-red-300 bg-red-50", textColor: "text-red-700", countColor: "text-red-800" },
          { key: "expiring_soon" as const, label: "Expiring Soon", color: "border-amber-300 bg-amber-50", textColor: "text-amber-700", countColor: "text-amber-800" },
          { key: "active" as const, label: "Active", color: "border-green-300 bg-green-50", textColor: "text-green-700", countColor: "text-green-800" },
          { key: "no_date" as const, label: "Urgency Notes", color: "border-gray-300 bg-gray-50", textColor: "text-gray-600", countColor: "text-gray-800" },
        ]).map(({ key, label, color, textColor, countColor }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`rounded-lg border p-3 text-left transition-all ${
              statusFilter === key ? `${color} ring-2 ring-offset-1 ring-current` : `${color} hover:shadow-sm`
            }`}
          >
            <div className={`text-2xl font-bold ${countColor}`}>{counts[key]}</div>
            <div className={`text-xs font-medium ${textColor}`}>{label}</div>
          </button>
        ))}
      </div>

      {/* Department filter */}
      <div className="flex flex-wrap gap-2">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              activeDept === dept
                ? "border-[#3a5f54] bg-[#3a5f54] text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-[#3a5f54]/40 hover:bg-[#3a5f54]/5"
            }`}
          >
            {dept}
            <span className={`ml-1.5 text-xs ${activeDept === dept ? "text-white/70" : "text-gray-400"}`}>
              {deptCounts[dept]}
            </span>
          </button>
        ))}
      </div>

      {/* Unified table */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/80">
            <span className="text-sm font-medium text-gray-700">
              {statusFilter === "all" ? "All Stop Sells" : statusFilter.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              {" "}({filtered.length})
            </span>
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Show All
              </button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((entry) => {
                const expStatus = getExpirationStatus(entry.stop_sell_expires);
                return (
                  <tr
                    key={entry.slug}
                    onClick={() => setSelectedEntry(entry)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-[#3a5f54]">{entry.name}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.region_name}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.department}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={expStatus} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {entry.stop_sell_expires ? (
                        <div>
                          <div className="text-gray-700">{entry.stop_sell_expires}</div>
                          <div className={`text-xs ${expStatus === "expired" ? "text-red-600 font-medium" : expStatus === "expiring_soon" ? "text-amber-600 font-medium" : "text-green-600"}`}>
                            {getCountdownText(entry.stop_sell_expires)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs">
                      {entry.stop_sell_note && (
                        <p className="truncate">{entry.stop_sell_note}</p>
                      )}
                      {entry.urgency && (
                        <p className="truncate text-amber-600">{entry.urgency}</p>
                      )}
                      {!entry.stop_sell_note && !entry.urgency && <span className="text-gray-300">&mdash;</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
          No stop sells or urgency alerts{activeDept !== "All" ? ` for ${activeDept}` : ""}{statusFilter !== "all" ? ` in this category` : ""}.
        </div>
      )}

      {selectedEntry && <DetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </div>
  );
}

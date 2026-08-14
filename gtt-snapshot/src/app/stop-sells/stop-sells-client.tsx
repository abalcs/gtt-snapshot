"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { StopSellEntry } from "./page";

const DEPARTMENTS = ["All", "ESE", "WEMEA", "CANAL", "Asia"] as const;

function getDaysUntilExpiry(expires: string | null): number | null {
  if (!expires) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(expires + "T00:00:00");
  return Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expires }: { expires: string | null }) {
  const days = getDaysUntilExpiry(expires);
  if (days === null) {
    return <span className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">No Date</span>;
  }
  if (days < 0) {
    return <span className="inline-flex items-center rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">Expired {Math.abs(days)}d ago</span>;
  }
  if (days <= 14) {
    return <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">{days}d remaining</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-green-100 border border-green-200 px-2 py-0.5 text-xs font-medium text-green-700">{days}d remaining</span>;
}

function DetailModal({ entry, onClose }: { entry: StopSellEntry; onClose: () => void }) {
  const days = getDaysUntilExpiry(entry.stop_sell_expires);
  const isStopSell = entry.status === "stop_sell" || !!entry.stop_sell_expires;

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
            {isStopSell && (
              <div className="flex items-center gap-3">
                <ExpiryBadge expires={entry.stop_sell_expires} />
                {entry.stop_sell_expires && (
                  <span className="text-sm text-gray-500">
                    Expires: {entry.stop_sell_expires}
                    {days !== null && ` (${days < 0 ? `${Math.abs(days)} days ago` : days === 0 ? "today" : `in ${days} days`})`}
                  </span>
                )}
              </div>
            )}

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
  const [selectedEntry, setSelectedEntry] = useState<StopSellEntry | null>(null);

  const filtered = activeDept === "All" ? entries : entries.filter((e) => e.department === activeDept);

  const stopSells = filtered.filter((e) => e.status === "stop_sell" || e.stop_sell_expires);
  const urgencyOnly = filtered.filter((e) => e.status !== "stop_sell" && !e.stop_sell_expires && e.urgency);

  const deptCounts = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = dept === "All" ? entries.length : entries.filter((e) => e.department === dept).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
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

      {/* Stop Sells section */}
      {stopSells.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Stop Sells</h2>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">{stopSells.length}</span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stopSells.map((entry) => (
                  <tr
                    key={entry.slug}
                    onClick={() => setSelectedEntry(entry)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-[#3a5f54]">{entry.name}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.region_name}</td>
                    <td className="px-4 py-3">
                      <ExpiryBadge expires={entry.stop_sell_expires} />
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
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Urgency Alerts section */}
      {urgencyOnly.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Urgency Alerts</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">{urgencyOnly.length}</span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {urgencyOnly.map((entry) => (
                  <tr
                    key={entry.slug}
                    onClick={() => setSelectedEntry(entry)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-[#3a5f54]">{entry.name}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.region_name}</td>
                    <td className="px-4 py-3 text-amber-600 max-w-md">
                      <p className="truncate">{entry.urgency}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {stopSells.length === 0 && urgencyOnly.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
          No stop sells or urgency alerts{activeDept !== "All" ? ` for ${activeDept}` : ""}.
        </div>
      )}

      {selectedEntry && <DetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </div>
  );
}

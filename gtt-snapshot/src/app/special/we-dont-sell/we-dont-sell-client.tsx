"use client";

import { useState } from "react";

interface RegionGroup {
  region: string;
  items: string[];
}

function parseContentByRegion(content: string): { groups: RegionGroup[]; notes: string[] } {
  const groups: RegionGroup[] = [];
  const notes: string[] = [];
  let currentRegion = "General";
  let currentItems: string[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      // Flush current group
      if (currentItems.length > 0) {
        groups.push({ region: currentRegion, items: currentItems });
        currentItems = [];
      }
      currentRegion = trimmed.slice(3).trim();
    } else if (trimmed.startsWith("### ")) {
      if (currentItems.length > 0) {
        groups.push({ region: currentRegion, items: currentItems });
        currentItems = [];
      }
      currentRegion = trimmed.slice(4).trim();
    } else if (trimmed.startsWith("- ")) {
      currentItems.push(trimmed.slice(2).trim());
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      notes.push(trimmed.replace(/\*\*/g, ""));
    } else if (!trimmed.startsWith("#")) {
      // Treat as a sub-item or note for the previous item
      if (currentItems.length > 0) {
        currentItems[currentItems.length - 1] += " " + trimmed;
      } else {
        notes.push(trimmed);
      }
    }
  }

  if (currentItems.length > 0) {
    groups.push({ region: currentRegion, items: currentItems });
  }

  return { groups, notes };
}

export function WeDontSellClient({ usContent, ukContent }: { usContent: string; ukContent: string }) {
  const [office, setOffice] = useState<"us" | "uk">("us");

  const content = office === "us" ? usContent : ukContent;
  const { groups, notes } = parseContentByRegion(content);

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setOffice("us")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            office === "us"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          US Office
        </button>
        <button
          onClick={() => setOffice("uk")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            office === "uk"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          UK Office
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Destinations the {office === "us" ? "US" : "UK"} office does not sell.
      </p>

      {/* Region groups */}
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.region} className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              {group.region}
            </h3>
            <ul className="space-y-1.5">
              {group.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground mt-1 shrink-0">&#x2022;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Notes */}
      {notes.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          {notes.map((note, i) => (
            <p key={i} className="text-sm font-medium text-amber-800">{note}</p>
          ))}
        </div>
      )}
    </div>
  );
}

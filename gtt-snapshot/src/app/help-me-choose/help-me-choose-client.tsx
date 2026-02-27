"use client";

import { useState, useEffect, useCallback } from "react";
import { ALL_TAGS, TAG_CATEGORIES, type TagCategory } from "@/lib/tags";
import { DestinationCard } from "@/components/destinations/destination-card";
import type { DestinationWithRegion } from "@/lib/types";

const categoryActiveMap: Record<TagCategory, string> = {
  'trip-style': 'bg-blue-600 text-white border-blue-600',
  'activities': 'bg-green-600 text-white border-green-600',
  'traveler-profile': 'bg-purple-600 text-white border-purple-600',
  'landscape': 'bg-amber-600 text-white border-amber-600',
};

const categoryInactiveMap: Record<TagCategory, string> = {
  'trip-style': 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  'activities': 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  'traveler-profile': 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  'landscape': 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
};

export function HelpMeChooseClient() {
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<DestinationWithRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const toggle = (slug: string) => {
    setSelected(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const clearAll = () => {
    setSelected([]);
    setResults([]);
    setFetched(false);
  };

  const fetchResults = useCallback(async (tags: string[]) => {
    if (tags.length === 0) {
      setResults([]);
      setFetched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/destinations/by-tags?tags=${tags.join(",")}`);
      const data = await res.json();
      setResults(data.destinations ?? []);
      setFetched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(selected), 300);
    return () => clearTimeout(timer);
  }, [selected, fetchResults]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help Me Choose</h1>
        <p className="text-muted-foreground mt-1">
          Select tags that match your client&apos;s interests. Results narrow as you add more tags.
        </p>
      </div>

      {/* Tag Picker */}
      <div className="bg-white border rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">What are they looking for?</h2>
          {selected.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Clear all ({selected.length})
            </button>
          )}
        </div>

        {TAG_CATEGORIES.map(cat => {
          const tags = ALL_TAGS.filter(t => t.category === cat.key);
          return (
            <div key={cat.key}>
              <p className="text-sm font-medium text-muted-foreground mb-2">{cat.label}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  const isActive = selected.includes(tag.slug);
                  return (
                    <button
                      key={tag.slug}
                      onClick={() => toggle(tag.slug)}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                        isActive
                          ? categoryActiveMap[cat.key]
                          : categoryInactiveMap[cat.key]
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Results */}
      <div>
        {loading && (
          <p className="text-sm text-muted-foreground">Searching...</p>
        )}

        {!loading && fetched && results.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-semibold text-foreground">{results.length}</span> destination{results.length !== 1 ? "s" : ""} match{results.length === 1 ? "es" : ""} all{" "}
              <span className="font-semibold text-foreground">{selected.length}</span> selected tag{selected.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(dest => (
                <DestinationCard key={dest.id} destination={dest} />
              ))}
            </div>
          </>
        )}

        {!loading && fetched && results.length === 0 && selected.length > 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border">
            <p className="text-muted-foreground">No destinations match all selected tags.</p>
            <p className="text-sm text-muted-foreground mt-1">Try removing some tags to broaden the search.</p>
          </div>
        )}

        {!loading && !fetched && selected.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border">
            <p className="text-muted-foreground">Select one or more tags above to find matching destinations.</p>
          </div>
        )}
      </div>
    </div>
  );
}

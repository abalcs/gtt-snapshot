"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface CompareBarProps {
  selectedSlugs: string[];
  destinationNames: Record<string, string>;
  onRemove: (slug: string) => void;
  onClear: () => void;
}

export function CompareBar({ selectedSlugs, destinationNames, onRemove, onClear }: CompareBarProps) {
  const router = useRouter();

  if (selectedSlugs.length === 0) return null;

  const handleCompare = () => {
    router.push(`/compare?slugs=${selectedSlugs.join(",")}`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <span className="text-sm font-medium shrink-0">
          Compare ({selectedSlugs.length}/3):
        </span>
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          {selectedSlugs.map((slug) => (
            <Badge
              key={slug}
              variant="secondary"
              className="flex items-center gap-1 cursor-pointer hover:bg-muted"
              onClick={() => onRemove(slug)}
            >
              {destinationNames[slug] || slug}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onClear}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
          <button
            onClick={handleCompare}
            disabled={selectedSlugs.length < 2}
            className="inline-flex items-center justify-center rounded-md bg-[#3a5f54] text-white px-4 py-2 text-sm font-medium hover:bg-[#2a4a40] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}

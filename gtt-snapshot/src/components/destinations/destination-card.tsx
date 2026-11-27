import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DestinationWithRegion, TagDefinition } from "@/lib/types";
import { TagBadges } from "@/components/destinations/tag-badges";
import { getFlagUrl } from "@/lib/country-flags";

interface DestinationCardProps {
  destination: DestinationWithRegion;
  tagDefinitions?: TagDefinition[];
  compareMode?: boolean;
  isSelected?: boolean;
  onToggleCompare?: (slug: string) => void;
}

export function DestinationCard({ destination, tagDefinitions, compareMode, isSelected, onToggleCompare }: DestinationCardProps) {
  // Best time to visit: the peak season date range from the seasonality data.
  // Seasonality is stored as a JSON string in some docs and an array in others.
  let bestTime: string | null = null;
  if (destination.seasonality) {
    try {
      const seasons = (Array.isArray(destination.seasonality)
        ? destination.seasonality
        : JSON.parse(destination.seasonality)) as { level?: string; date_range?: string }[];
      const peak = seasons.find((s) => (s.level ?? "").toLowerCase() === "peak");
      bestTime = peak?.date_range ?? null;
    } catch { /* seasonality is free text for some destinations */ }
  }
  // night_min is a number in some stored docs, a string in others.
  const nights = String(destination.night_min ?? "").trim();
  const nightsLabel = /^\d[\d\s\-\u2013]*$/.test(nights) ? `${nights} nights` : nights;
  const cardContent = (
    <Card className={`h-full border-l-4 ${destination.status === "stop_sell" ? "border-l-red-500" : "border-l-[#0e4d5c]"} hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-200 cursor-pointer ${compareMode && isSelected ? "ring-2 ring-[#0e4d5c] shadow-[0_0_0_4px_rgba(14,77,92,0.10)]" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {compareMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleCompare?.(destination.slug)}
                className="h-4 w-4 rounded border-gray-300 text-[#0e4d5c] accent-[#0e4d5c] shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {getFlagUrl(destination.name) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getFlagUrl(destination.name)} alt="" className="h-4 w-6 shrink-0 rounded-[2px] object-cover shadow-sm" />
            )}
            <CardTitle className="text-lg">{destination.name}</CardTitle>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {destination.region_name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {destination.urgency && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {destination.urgency}
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          {nights && nights.length <= 30 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              {nightsLabel}
            </span>
          )}
          {bestTime && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0e4d5c]/5 px-2 py-0.5 text-[#0e4d5c]">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              Best {bestTime}
            </span>
          )}
          {destination.status !== "active" && (
            <Badge variant="destructive" className="text-xs">
              {destination.status === "stop_sell" ? "Stop Sell" : "Not Selling"}
            </Badge>
          )}
        </div>
        {destination.tags && destination.tags.length > 0 && (
          <TagBadges tags={destination.tags} limit={3} tagDefinitions={tagDefinitions} />
        )}
        {destination.pair_with && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Pair with:</span> {destination.pair_with}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (compareMode) {
    return (
      <div onClick={() => onToggleCompare?.(destination.slug)}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/destinations/${destination.slug}`}>
      {cardContent}
    </Link>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { DestinationWithRegion, TagDefinition } from "@/lib/types";
import { TagBadges } from "@/components/destinations/tag-badges";
import { getFlagUrl } from "@/lib/country-flags";

interface MapPopupCardProps {
  destination: DestinationWithRegion;
  tagDefinitions: TagDefinition[];
  matchBadges: { label: string; color: string }[];
  compareMode: boolean;
  isSelected: boolean;
  onToggleCompare: (slug: string) => void;
}

export function MapPopupCard({
  destination,
  tagDefinitions,
  matchBadges,
  compareMode,
  isSelected,
  onToggleCompare,
}: MapPopupCardProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base leading-tight flex items-center gap-1.5">
          {getFlagUrl(destination.name) && (
            <img
              src={getFlagUrl(destination.name)}
              alt=""
              className="h-4 w-5 object-cover rounded-sm shrink-0"
            />
          )}
          {destination.name}
        </h3>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {destination.region_name}
        </Badge>
      </div>

      {destination.urgency && (
        <p className="text-muted-foreground text-xs line-clamp-2">{destination.urgency}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {destination.night_min && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            {destination.night_min}
          </span>
        )}
        {destination.status !== "active" && (
          <Badge variant="destructive" className="text-[10px]">
            {destination.status === "stop_sell" ? "Stop Sell" : "Not Selling"}
          </Badge>
        )}
      </div>

      {destination.tags && destination.tags.length > 0 && (
        <TagBadges tags={destination.tags} limit={3} tagDefinitions={tagDefinitions} />
      )}

      {matchBadges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {matchBadges.map((badge, i) => (
            <span key={i} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}>
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {destination.pair_with && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Pair with:</span> {destination.pair_with}
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <Link
          href={`/destinations/${destination.slug}`}
          className="text-xs font-medium text-[#3a5f54] hover:underline"
        >
          View Details &rarr;
        </Link>
        {compareMode && (
          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleCompare(destination.slug)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#3a5f54] accent-[#3a5f54]"
            />
            Compare
          </label>
        )}
      </div>
    </div>
  );
}

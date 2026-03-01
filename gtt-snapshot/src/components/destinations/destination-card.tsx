import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DestinationWithRegion, TagDefinition } from "@/lib/types";
import { TagBadges } from "@/components/destinations/tag-badges";

interface DestinationCardProps {
  destination: DestinationWithRegion;
  tagDefinitions?: TagDefinition[];
  compareMode?: boolean;
  isSelected?: boolean;
  onToggleCompare?: (slug: string) => void;
}

export function DestinationCard({ destination, tagDefinitions, compareMode, isSelected, onToggleCompare }: DestinationCardProps) {
  const cardContent = (
    <Card className={`h-full hover:shadow-md transition-shadow cursor-pointer ${compareMode && isSelected ? "ring-2 ring-[#3a5f54]" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {compareMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleCompare?.(destination.slug)}
                className="h-4 w-4 rounded border-gray-300 text-[#3a5f54] accent-[#3a5f54] shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
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
          {destination.night_min && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              {destination.night_min}
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

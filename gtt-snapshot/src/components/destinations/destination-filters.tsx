"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { RegionWithCount } from "@/lib/types";

export function DestinationFilters({
  regions,
  currentRegions,
}: {
  regions: RegionWithCount[];
  currentRegions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleRegion = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!slug) {
      // "All" clears region filter
      params.delete("region");
    } else {
      const updated = currentRegions.includes(slug)
        ? currentRegions.filter((r) => r !== slug)
        : [...currentRegions, slug];
      if (updated.length > 0) {
        params.set("region", updated.join(","));
      } else {
        params.delete("region");
      }
    }
    router.push(`/destinations?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={currentRegions.length === 0 ? "default" : "outline"}
        size="sm"
        onClick={() => toggleRegion()}
      >
        All
      </Button>
      {regions.map((region) => (
        <Button
          key={region.slug}
          variant={currentRegions.includes(region.slug) ? "default" : "outline"}
          size="sm"
          onClick={() => toggleRegion(region.slug)}
        >
          {region.name} ({region.destination_count})
        </Button>
      ))}
    </div>
  );
}

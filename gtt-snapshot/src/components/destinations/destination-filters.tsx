"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { RegionWithCount } from "@/lib/types";

export function DestinationFilters({
  regions,
  currentRegion,
}: {
  regions: RegionWithCount[];
  currentRegion?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setRegion = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("region", slug);
    } else {
      params.delete("region");
    }
    router.push(`/destinations?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={!currentRegion ? "default" : "outline"}
        size="sm"
        onClick={() => setRegion()}
      >
        All
      </Button>
      {regions.map((region) => (
        <Button
          key={region.slug}
          variant={currentRegion === region.slug ? "default" : "outline"}
          size="sm"
          onClick={() => setRegion(region.slug)}
        >
          {region.name} ({region.destination_count})
        </Button>
      ))}
    </div>
  );
}

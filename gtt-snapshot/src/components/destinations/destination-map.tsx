"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Expand, Minimize2 } from "lucide-react";

const MiniMap = dynamic(() => import("./mini-map"), {
  ssr: false,
  loading: () => <MapSkeleton height="192px" />,
});

const InteractiveMap = dynamic(() => import("./interactive-map"), {
  ssr: false,
  loading: () => <MapSkeleton height="400px" />,
});

function MapSkeleton({ height }: { height: string }) {
  return (
    <div
      className="bg-muted animate-pulse rounded-md flex items-center justify-center"
      style={{ height }}
    >
      <MapPin className="h-8 w-8 text-muted-foreground/40" />
    </div>
  );
}

interface DestinationMapProps {
  lat: number;
  lng: number;
  zoom: number;
  name: string;
}

export default function DestinationMap({ lat, lng, zoom, name }: DestinationMapProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="print:hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-xs gap-1.5"
          >
            {expanded ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                Show Mini Map
              </>
            ) : (
              <>
                <Expand className="h-3.5 w-3.5" />
                Explore Map
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {expanded ? (
          <InteractiveMap lat={lat} lng={lng} zoom={zoom} name={name} />
        ) : (
          <MiniMap lat={lat} lng={lng} zoom={zoom} />
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCoordinates } from "@/lib/country-coordinates";
import { MapPopupCard } from "@/components/destinations/map-popup-card";
import type { DestinationWithRegion, TagDefinition } from "@/lib/types";

const MAP_HEIGHT = 600;

const REGION_COLORS: Record<string, string> = {
  "africa": "#d97706",
  "asia": "#e11d48",
  "australasia": "#0891b2",
  "europe": "#2563eb",
  "latin-america": "#059669",
  "middle-east": "#ea580c",
  "uk-ireland": "#4f46e5",
  "usa-canada": "#475569",
};

function getRegionColor(regionSlug: string): string {
  return REGION_COLORS[regionSlug] ?? "#6b7280";
}

function createMarkerIcon(
  regionSlug: string,
  opts: { dimmed?: boolean; selected?: boolean; stopSell?: boolean }
): L.DivIcon {
  const color = opts.dimmed ? "#9ca3af" : getRegionColor(regionSlug);
  const size = opts.selected ? 16 : 12;
  const borderColor = opts.stopSell ? "#ef4444" : "#ffffff";
  const borderWidth = opts.selected ? 3 : 2;
  const ringColor = opts.selected ? "#3a5f54" : "none";
  const ringWidth = opts.selected ? 3 : 0;
  const opacity = opts.dimmed ? 0.3 : 1;
  const totalSize = size + borderWidth * 2 + ringWidth * 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" style="opacity:${opacity};filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">
    ${opts.selected ? `<circle cx="${totalSize / 2}" cy="${totalSize / 2}" r="${totalSize / 2}" fill="${ringColor}"/>` : ""}
    <circle cx="${totalSize / 2}" cy="${totalSize / 2}" r="${size / 2 + borderWidth}" fill="${borderColor}"/>
    <circle cx="${totalSize / 2}" cy="${totalSize / 2}" r="${size / 2}" fill="${color}"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [totalSize, totalSize],
    iconAnchor: [totalSize / 2, totalSize / 2],
  });
}

// ── Geographic labels rendered as styled text markers ──────────────

interface GeoLabel {
  name: string;
  lat: number;
  lng: number;
  minZoom: number;
  maxZoom: number;
  kind: "continent" | "ocean" | "region";
}

const GEO_LABELS: GeoLabel[] = [
  // Continents
  { name: "AFRICA",         lat: 5,    lng: 22,   minZoom: 2, maxZoom: 4, kind: "continent" },
  { name: "EUROPE",         lat: 52,   lng: 15,   minZoom: 2, maxZoom: 4, kind: "continent" },
  { name: "ASIA",           lat: 48,   lng: 85,   minZoom: 2, maxZoom: 4, kind: "continent" },
  { name: "NORTH AMERICA",  lat: 48,   lng: -100, minZoom: 2, maxZoom: 4, kind: "continent" },
  { name: "SOUTH AMERICA",  lat: -15,  lng: -58,  minZoom: 2, maxZoom: 4, kind: "continent" },
  { name: "OCEANIA",        lat: -25,  lng: 140,  minZoom: 2, maxZoom: 4, kind: "continent" },
  // Oceans
  { name: "Pacific Ocean",       lat: 0,    lng: -150, minZoom: 2, maxZoom: 3, kind: "ocean" },
  { name: "Atlantic Ocean",      lat: 10,   lng: -35,  minZoom: 2, maxZoom: 3, kind: "ocean" },
  { name: "Indian Ocean",        lat: -20,  lng: 75,   minZoom: 2, maxZoom: 3, kind: "ocean" },
  { name: "Southern Ocean",      lat: -62,  lng: 0,    minZoom: 2, maxZoom: 3, kind: "ocean" },
  // Sub-regions (visible when zoomed a bit more)
  { name: "Middle East",         lat: 28,   lng: 45,   minZoom: 3, maxZoom: 5, kind: "region" },
  { name: "Southeast Asia",      lat: 8,    lng: 110,  minZoom: 3, maxZoom: 5, kind: "region" },
  { name: "Central America",     lat: 14,   lng: -85,  minZoom: 3, maxZoom: 5, kind: "region" },
  { name: "Caribbean",           lat: 20,   lng: -72,  minZoom: 3, maxZoom: 5, kind: "region" },
  { name: "East Africa",         lat: -3,   lng: 36,   minZoom: 4, maxZoom: 6, kind: "region" },
  { name: "Southern Africa",     lat: -28,  lng: 25,   minZoom: 4, maxZoom: 6, kind: "region" },
];

const LABEL_STYLES: Record<GeoLabel["kind"], string> = {
  continent: "font-size:13px;font-weight:400;letter-spacing:0.2em;color:rgba(60,60,60,0.45)",
  ocean:     "font-size:12px;font-weight:300;font-style:italic;letter-spacing:0.12em;color:rgba(50,80,120,0.35)",
  region:    "font-size:11px;font-weight:400;letter-spacing:0.1em;color:rgba(60,60,60,0.35)",
};

function createLabelIcon(label: GeoLabel): L.DivIcon {
  const style = LABEL_STYLES[label.kind];
  return L.divIcon({
    html: `<span style="white-space:nowrap;font-family:system-ui,sans-serif;${style}">${label.name}</span>`,
    className: "",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function MapLabels() {
  const [zoom, setZoom] = useState(2);
  const map = useMapEvents({
    zoomend: () => setZoom(Math.round(map.getZoom())),
  });

  return (
    <>
      {GEO_LABELS.filter(l => zoom >= l.minZoom && zoom <= l.maxZoom).map(label => (
        <Marker
          key={label.name}
          position={[label.lat, label.lng]}
          icon={createLabelIcon(label)}
          interactive={false}
        />
      ))}
    </>
  );
}

// ── Child component to capture map ref + close popup on background click ──

function MapSetup({
  mapRef,
  onBackgroundClick,
}: {
  mapRef: React.MutableRefObject<L.Map | null>;
  onBackgroundClick: () => void;
}) {
  const map = useMap();
  mapRef.current = map;
  useMapEvents({
    click: onBackgroundClick,
  });
  return null;
}

// ── Main component ─────────────────────────────────────────────────

interface WorldMapProps {
  allDestinations: DestinationWithRegion[];
  filteredSlugs: Set<string>;
  hasFilters: boolean;
  hideDimmed: boolean;
  tagDefinitions: TagDefinition[];
  compareMode: boolean;
  selectedSlugs: string[];
  onToggleCompare: (slug: string) => void;
  buildMatchBadges: (dest: DestinationWithRegion) => { label: string; color: string }[];
}

export default function WorldMap({
  allDestinations,
  filteredSlugs,
  hasFilters,
  hideDimmed,
  tagDefinitions,
  compareMode,
  selectedSlugs,
  onToggleCompare,
  buildMatchBadges,
}: WorldMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [activeDest, setActiveDest] = useState<DestinationWithRegion | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [popupBelow, setPopupBelow] = useState(false);

  const closePopup = useCallback(() => {
    setActiveDest(null);
    setPopupPos(null);
  }, []);

  const handleMarkerClick = useCallback((dest: DestinationWithRegion) => {
    if (!mapRef.current) return;
    const coords = getCoordinates(dest.slug);
    if (!coords) return;

    if (activeDest?.slug === dest.slug) {
      closePopup();
      return;
    }

    const point = mapRef.current.latLngToContainerPoint([coords.lat, coords.lng]);
    // Show popup below marker if it's in the top 40% of the map
    setPopupBelow(point.y < MAP_HEIGHT * 0.4);
    setActiveDest(dest);
    setPopupPos({ x: point.x, y: point.y });
  }, [activeDest, closePopup]);

  const visibleDestinations = allDestinations.filter((dest) => {
    const coords = getCoordinates(dest.slug);
    if (!coords) return false;
    if (hasFilters && hideDimmed && !filteredSlugs.has(dest.slug)) return false;
    return true;
  });

  return (
    <div className="relative">
      <MapContainer
        center={[30, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        style={{ height: `${MAP_HEIGHT}px`, width: "100%" }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        className="rounded-lg border border-border"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapSetup mapRef={mapRef} onBackgroundClick={closePopup} />
        <MapLabels />
        {visibleDestinations.map((dest) => {
          const coords = getCoordinates(dest.slug)!;
          const isMatch = filteredSlugs.has(dest.slug);
          const isDimmed = hasFilters && !isMatch;
          const isSelected = selectedSlugs.includes(dest.slug);
          const isStopSell = dest.status === "stop_sell";

          const icon = createMarkerIcon(dest.region_slug, {
            dimmed: isDimmed,
            selected: isSelected,
            stopSell: isStopSell,
          });

          return (
            <Marker
              key={dest.slug}
              position={[coords.lat, coords.lng]}
              icon={icon}
              eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e.originalEvent); handleMarkerClick(dest); } }}
            />
          );
        })}
      </MapContainer>

      {/* Custom popup rendered outside map container so it's never clipped */}
      {activeDest && popupPos && (
        <div
          className="absolute z-[1000] pointer-events-auto"
          style={{
            left: popupPos.x,
            ...(popupBelow
              ? { top: popupPos.y + 12 }
              : { top: popupPos.y - 12, transform: "translate(-50%, -100%)" }),
            ...(!popupBelow ? {} : { transform: "translateX(-50%)" }),
          }}
        >
          {/* Arrow tip */}
          {popupBelow ? (
            <div className="flex justify-center -mb-1">
              <div className="w-3 h-3 bg-white border-l border-t border-border rotate-45 -translate-y-0.5" />
            </div>
          ) : null}

          <div className="bg-white rounded-xl shadow-lg border border-border w-[280px]">
            <div className="flex justify-end p-1 pb-0">
              <button
                onClick={closePopup}
                className="text-muted-foreground hover:text-foreground text-lg leading-none px-1.5"
              >
                &times;
              </button>
            </div>
            <div className="px-3.5 pb-3.5 -mt-1">
              <MapPopupCard
                destination={activeDest}
                tagDefinitions={tagDefinitions}
                matchBadges={
                  hasFilters && !filteredSlugs.has(activeDest.slug)
                    ? []
                    : buildMatchBadges(activeDest)
                }
                compareMode={compareMode}
                isSelected={selectedSlugs.includes(activeDest.slug)}
                onToggleCompare={onToggleCompare}
              />
            </div>
          </div>

          {/* Arrow tip below */}
          {!popupBelow ? (
            <div className="flex justify-center -mt-1">
              <div className="w-3 h-3 bg-white border-r border-b border-border rotate-45 translate-y-0.5" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

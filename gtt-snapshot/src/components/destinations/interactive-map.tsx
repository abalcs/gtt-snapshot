"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Use CDN-hosted marker icon to avoid webpack path issues
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface InteractiveMapProps {
  lat: number;
  lng: number;
  zoom: number;
  name: string;
}

export default function InteractiveMap({ lat, lng, zoom, name }: InteractiveMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      zoomSnap={0}
      zoomDelta={1}
      wheelPxPerZoomLevel={60}
      style={{ height: "400px", width: "100%" }}
      scrollWheelZoom={true}
      className="rounded-md"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[lat, lng]} icon={markerIcon}>
        <Popup>{name}</Popup>
      </Marker>
    </MapContainer>
  );
}

/**
 * Flight time estimation utilities.
 * Uses Haversine (great circle) math with a fixed cruise speed + overhead.
 */

export interface DepartureCity {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

export const US_DEPARTURE_CITIES: DepartureCity[] = [
  { code: "JFK", name: "New York (JFK)", lat: 40.6413, lng: -73.7781 },
  { code: "LAX", name: "Los Angeles (LAX)", lat: 33.9425, lng: -118.4081 },
  { code: "ORD", name: "Chicago (ORD)", lat: 41.9742, lng: -87.9073 },
  { code: "ATL", name: "Atlanta (ATL)", lat: 33.6407, lng: -84.4277 },
  { code: "DFW", name: "Dallas (DFW)", lat: 32.8998, lng: -97.0403 },
  { code: "MIA", name: "Miami (MIA)", lat: 25.7959, lng: -80.2870 },
  { code: "SFO", name: "San Francisco (SFO)", lat: 37.6213, lng: -122.3790 },
  { code: "SEA", name: "Seattle (SEA)", lat: 47.4502, lng: -122.3088 },
  { code: "BOS", name: "Boston (BOS)", lat: 42.3656, lng: -71.0096 },
  { code: "IAD", name: "Washington DC (IAD)", lat: 38.9531, lng: -77.4565 },
  { code: "DEN", name: "Denver (DEN)", lat: 39.8561, lng: -104.6737 },
  { code: "PHL", name: "Philadelphia (PHL)", lat: 39.8721, lng: -75.2411 },
  { code: "IAH", name: "Houston (IAH)", lat: 29.9902, lng: -95.3368 },
  { code: "MSP", name: "Minneapolis (MSP)", lat: 44.8848, lng: -93.2223 },
  { code: "DTW", name: "Detroit (DTW)", lat: 42.2124, lng: -83.3534 },
];

const CRUISE_SPEED_KMH = 885;
const OVERHEAD_HOURS = 0.5;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateFlightHours(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dist = haversineDistanceKm(fromLat, fromLng, toLat, toLng);
  const raw = dist / CRUISE_SPEED_KMH + OVERHEAD_HOURS;
  return Math.round(raw * 2) / 2; // round to nearest 0.5
}

export function formatFlightTime(hours: number): string {
  if (hours % 1 === 0) {
    return `~${hours} hours`;
  }
  return `~${hours} hours`;
}

export function getFlightTimeForSlug(
  departureCode: string,
  destLat: number,
  destLng: number
): number | null {
  const city = US_DEPARTURE_CITIES.find((c) => c.code === departureCode);
  if (!city) return null;
  return estimateFlightHours(city.lat, city.lng, destLat, destLng);
}

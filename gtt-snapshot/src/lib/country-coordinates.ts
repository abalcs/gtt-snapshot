/**
 * Static mapping of destination slugs to geographic coordinates.
 * Used by the destination map components for geographic orientation.
 */

export interface DestinationCoordinates {
  lat: number;
  lng: number;
  zoom: number;
}

const coordinates: Record<string, DestinationCoordinates> = {
  // ── ASIA ──────────────────────────────────────────────
  "bhutan":           { lat: 27.5, lng: 90.5, zoom: 7 },
  "cambodia":         { lat: 12.5, lng: 105.0, zoom: 7 },
  "china":            { lat: 35.0, lng: 105.0, zoom: 4 },
  "india":            { lat: 20.6, lng: 79.0, zoom: 5 },
  "indonesia":        { lat: -2.5, lng: 118.0, zoom: 4 },
  "japan":            { lat: 36.2, lng: 138.3, zoom: 5 },
  "laos":             { lat: 18.2, lng: 103.9, zoom: 6 },
  "malaysia":         { lat: 4.2, lng: 101.9, zoom: 6 },
  "malaysian-borneo": { lat: 2.5, lng: 113.0, zoom: 6 },
  "maldives":         { lat: 3.2, lng: 73.2, zoom: 7 },
  "myanmar":          { lat: 19.8, lng: 96.1, zoom: 6 },
  "nepal":            { lat: 28.4, lng: 84.1, zoom: 7 },
  "philippines":      { lat: 12.9, lng: 121.8, zoom: 5 },
  "singapore":        { lat: 1.35, lng: 103.8, zoom: 11 },
  "south-korea":      { lat: 36.5, lng: 128.0, zoom: 7 },
  "sri-lanka":        { lat: 7.9, lng: 80.8, zoom: 7 },
  "the-stans":        { lat: 41.0, lng: 65.0, zoom: 5 },
  "kyrgyzstan":       { lat: 41.2, lng: 74.8, zoom: 7 },
  "uzbekistan":       { lat: 41.3, lng: 64.6, zoom: 6 },
  "thailand":         { lat: 15.9, lng: 101.0, zoom: 6 },
  "tibet":            { lat: 31.5, lng: 88.0, zoom: 6 },
  "vietnam":          { lat: 16.0, lng: 107.8, zoom: 6 },

  // ── AFRICA ────────────────────────────────────────────
  "botswana":      { lat: -22.3, lng: 24.7, zoom: 6 },
  "kenya":         { lat: 0.0, lng: 37.9, zoom: 6 },
  "madagascar":    { lat: -18.8, lng: 46.9, zoom: 5 },
  "malawi":        { lat: -13.3, lng: 34.3, zoom: 6 },
  "mauritius":     { lat: -20.3, lng: 57.6, zoom: 10 },
  "namibia":       { lat: -22.6, lng: 17.1, zoom: 5 },
  "rwanda":        { lat: -1.9, lng: 29.9, zoom: 8 },
  "seychelles":    { lat: -4.7, lng: 55.5, zoom: 10 },
  "south-africa":  { lat: -30.6, lng: 25.0, zoom: 5 },
  "tanzania":      { lat: -6.4, lng: 34.9, zoom: 6 },
  "uganda":        { lat: 1.4, lng: 32.3, zoom: 7 },
  "zambia":        { lat: -13.1, lng: 27.8, zoom: 6 },
  "zanzibar":      { lat: -6.2, lng: 39.2, zoom: 9 },
  "zimbabwe":      { lat: -19.0, lng: 29.2, zoom: 6 },

  // ── ANZ + PACIFIC ─────────────────────────────────────
  "australia":         { lat: -25.3, lng: 133.8, zoom: 4 },
  "new-zealand":       { lat: -41.3, lng: 174.8, zoom: 5 },
  "cook-islands":      { lat: -21.2, lng: -159.8, zoom: 9 },
  "fiji":              { lat: -17.7, lng: 178.1, zoom: 7 },
  "french-polynesia":  { lat: -17.7, lng: -149.4, zoom: 7 },

  // ── CANAL (Central/North/South America) ───────────────
  "antarctica":       { lat: -75.0, lng: 0.0, zoom: 3 },
  "arctic-svalbard":  { lat: 78.0, lng: 16.0, zoom: 5 },
  "argentina":        { lat: -38.4, lng: -63.6, zoom: 4 },
  "belize":           { lat: 17.2, lng: -88.5, zoom: 8 },
  "bolivia":          { lat: -16.3, lng: -63.6, zoom: 5 },
  "brazil":           { lat: -14.2, lng: -51.9, zoom: 4 },
  "canada-east":      { lat: 48.0, lng: -68.0, zoom: 5 },
  "canada-west":      { lat: 54.0, lng: -122.0, zoom: 5 },
  "chile":            { lat: -35.7, lng: -71.5, zoom: 4 },
  "colombia":         { lat: 4.6, lng: -74.1, zoom: 5 },
  "costa-rica":       { lat: 9.7, lng: -83.8, zoom: 7 },
  "cuba":             { lat: 21.5, lng: -80.0, zoom: 7 },
  "ecuador":          { lat: -1.8, lng: -78.2, zoom: 6 },
  "galapagos":        { lat: -0.7, lng: -90.4, zoom: 8 },
  "guatemala":        { lat: 15.8, lng: -90.2, zoom: 7 },
  "honduras":         { lat: 15.2, lng: -86.2, zoom: 7 },
  "mexico":           { lat: 23.6, lng: -102.6, zoom: 5 },
  "panama":           { lat: 8.5, lng: -80.8, zoom: 7 },
  "paraguay":         { lat: -23.4, lng: -58.4, zoom: 6 },
  "peru":             { lat: -9.2, lng: -75.0, zoom: 5 },
  "uruguay":          { lat: -32.5, lng: -55.8, zoom: 7 },
  "usa-alaska":       { lat: 64.2, lng: -152.5, zoom: 4 },
  "usa-california":   { lat: 36.8, lng: -119.4, zoom: 6 },
  "usa-hawaii":       { lat: 20.8, lng: -156.3, zoom: 7 },
  "usa-national-parks": { lat: 39.8, lng: -105.8, zoom: 4 },
  "usa-new-england":  { lat: 43.5, lng: -71.5, zoom: 6 },

  // ── ESE (Europe & Southeast Europe) ───────────────────
  "austria":                { lat: 47.5, lng: 14.6, zoom: 7 },
  "belgium":                { lat: 50.5, lng: 4.5, zoom: 8 },
  "croatia":                { lat: 44.5, lng: 16.0, zoom: 7 },
  "czech-republic-prague":  { lat: 50.1, lng: 14.4, zoom: 7 },
  "denmark":                { lat: 56.3, lng: 9.5, zoom: 7 },
  "france":                 { lat: 46.6, lng: 2.2, zoom: 6 },
  "germany":                { lat: 51.2, lng: 10.5, zoom: 6 },
  "greece":                 { lat: 38.3, lng: 23.7, zoom: 6 },
  "hungary-budapest":       { lat: 47.5, lng: 19.0, zoom: 7 },
  "italy":                  { lat: 42.5, lng: 12.6, zoom: 5 },
  "luxembourg":             { lat: 49.8, lng: 6.1, zoom: 10 },
  "netherlands":            { lat: 52.1, lng: 5.3, zoom: 7 },
  "norway":                 { lat: 64.0, lng: 12.0, zoom: 4 },
  "sardinia":               { lat: 40.1, lng: 9.1, zoom: 8 },
  "sweden":                 { lat: 62.0, lng: 15.0, zoom: 4 },
  "switzerland":            { lat: 46.8, lng: 8.2, zoom: 8 },

  // ── WEMEA ─────────────────────────────────────────────
  "azores":    { lat: 38.7, lng: -27.2, zoom: 8 },
  "egypt":     { lat: 26.8, lng: 30.8, zoom: 5 },
  "england":   { lat: 52.4, lng: -1.2, zoom: 6 },
  "iceland":   { lat: 64.9, lng: -19.0, zoom: 6 },
  "ireland":   { lat: 53.4, lng: -8.2, zoom: 6 },
  "portugal":  { lat: 39.4, lng: -8.2, zoom: 6 },
  "scotland":  { lat: 56.5, lng: -4.2, zoom: 6 },
  "spain":     { lat: 40.5, lng: -3.7, zoom: 6 },

  // ── MIDDLE EAST ───────────────────────────────────────
  "israel":   { lat: 31.5, lng: 34.8, zoom: 7 },
  "jordan":   { lat: 31.2, lng: 36.5, zoom: 7 },
  "morocco":  { lat: 31.8, lng: -7.1, zoom: 5 },
  "oman":     { lat: 21.5, lng: 57.0, zoom: 6 },
  "turkey":   { lat: 39.9, lng: 32.9, zoom: 5 },
  "uae":      { lat: 23.4, lng: 53.8, zoom: 7 },
};

export function getCoordinates(slug: string): DestinationCoordinates | null {
  return coordinates[slug] ?? null;
}

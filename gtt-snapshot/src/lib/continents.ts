// Maps each destination slug to its continent.
// Destinations not listed here inherit from their region's default continent.

const DESTINATION_CONTINENT_OVERRIDES: Record<string, string> = {
  // CANAL region → split across continents
  "antarctica": "Polar Regions",
  "arctic-svalbard": "Polar Regions",
  "canada-east": "North America",
  "canada-west": "North America",
  "usa-alaska": "North America",
  "usa-california": "North America",
  "usa-hawaii": "North America",
  "usa-national-parks": "North America",
  "usa-new-england": "North America",
  "mexico": "North America",
  "argentina": "South America",
  "belize": "Central America & Caribbean",
  "bolivia": "South America",
  "brazil": "South America",
  "chile": "South America",
  "colombia": "South America",
  "costa-rica": "Central America & Caribbean",
  "ecuador": "South America",
  "galapagos": "South America",
  "guatemala": "Central America & Caribbean",
  "panama": "Central America & Caribbean",
  "peru": "South America",
  "uruguay": "South America",
  // WEMEA region → split across continents
  "egypt": "Middle East & North Africa",
  "england": "Europe",
  "scotland": "Europe",
  "ireland": "Europe",
  "iceland": "Europe",
  "portugal": "Europe",
  "spain": "Europe",
  "azores": "Europe",
  "river-cruises": "Europe",
};

// Default continent for each region slug
const REGION_DEFAULT_CONTINENT: Record<string, string> = {
  "anz-pacific": "Oceania",
  "africa": "Africa",
  "asia": "Asia",
  "canal": "Americas",
  "ese": "Europe",
  "wemea": "Europe",
  "middle-east": "Middle East & North Africa",
};

// Display order for continents
const CONTINENT_ORDER: string[] = [
  "Africa",
  "Asia",
  "Europe",
  "Middle East & North Africa",
  "North America",
  "Central America & Caribbean",
  "South America",
  "Oceania",
  "Polar Regions",
];

export function getContinentForDestination(destSlug: string, regionSlug: string): string {
  return DESTINATION_CONTINENT_OVERRIDES[destSlug] ?? REGION_DEFAULT_CONTINENT[regionSlug] ?? "Other";
}

export function getContinentOrder(): string[] {
  return CONTINENT_ORDER;
}

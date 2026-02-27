// Country/Destination to ISO 3166-1 alpha-2 code mapping
// Uses flagcdn.com SVG flags for cross-platform rendering (Windows doesn't show emoji flags)

const countryCodes: Record<string, string> = {
  // Africa
  "Botswana": "bw",
  "Kenya": "ke",
  "Mauritius": "mu",
  "Namibia": "na",
  "Madagascar": "mg",
  "Malawi": "mw",
  "South Africa": "za",
  "Rwanda": "rw",
  "Tanzania": "tz",
  "Zanzibar": "tz",
  "Seychelles": "sc",
  "Uganda": "ug",
  "Zambia": "zm",
  "Zimbabwe": "zw",

  // Asia
  "Bhutan": "bt",
  "Cambodia": "kh",
  "China": "cn",
  "India": "in",
  "Indonesia": "id",
  "Japan": "jp",
  "Laos": "la",
  "Malaysia": "my",
  "Malaysian Borneo": "my",
  "Maldives": "mv",
  "Nepal": "np",
  "Philippines": "ph",
  "Sri Lanka": "lk",
  "Singapore": "sg",
  "South Korea": "kr",
  "The Stans": "uz",
  "Kyrgyzstan": "kg",
  "Uzbekistan": "uz",
  "Thailand": "th",
  "Vietnam": "vn",
  "Myanmar": "mm",
  "Tibet": "cn",

  // WEMEA
  "Iceland": "is",
  "Ireland": "ie",
  "England": "gb-eng",
  "Portugal": "pt",
  "Azores": "pt",
  "Scotland": "gb-sct",
  "Spain": "es",
  "Egypt": "eg",

  // ESE
  "Austria": "at",
  "Belgium": "be",
  "Croatia": "hr",
  "Czech Republic (Prague)": "cz",
  "France": "fr",
  "Denmark": "dk",
  "Germany": "de",
  "Greece": "gr",
  "Hungary (Budapest)": "hu",
  "Italy": "it",
  "Sardinia": "it",
  "Luxembourg": "lu",
  "Netherlands": "nl",
  "Norway": "no",
  "Sweden": "se",
  "Switzerland": "ch",

  // CANAL
  "USA - Alaska": "us",
  "USA - California": "us",
  "USA - Hawaii": "us",
  "USA - New England": "us",
  "USA - National Parks": "us",
  "Antarctica": "aq",
  "Arctic Svalbard": "no",
  "Argentina": "ar",
  "Belize": "bz",
  "Bolivia": "bo",
  "Brazil": "br",
  "Canada (East)": "ca",
  "Canada (West)": "ca",
  "Colombia": "co",
  "Costa Rica": "cr",
  "Ecuador": "ec",
  "Chile": "cl",
  "Galapagos": "ec",
  "Guatemala": "gt",
  "Mexico": "mx",
  "Peru": "pe",
  "Panama": "pa",
  "Uruguay": "uy",
  "Honduras": "hn",
  "Cuba": "cu",
  "Paraguay": "py",

  // ANZ + Pacific
  "Australia": "au",
  "New Zealand": "nz",
  "Cook Islands": "ck",
  "Fiji": "fj",
  "French Polynesia": "pf",

  // Middle East
  "Israel": "il",
  "Jordan": "jo",
  "Morocco": "ma",
  "Turkey": "tr",
  "Oman": "om",
  "UAE": "ae",
};

/**
 * Get the flag image URL for a destination/country name.
 * Returns a flagcdn.com SVG URL, or empty string if not mapped.
 */
export function getFlagUrl(name: string): string {
  const code = countryCodes[name];
  if (!code) return "";
  return `https://flagcdn.com/${code}.svg`;
}

/**
 * Get the ISO country code for a destination name.
 */
export function getFlag(name: string): string {
  return countryCodes[name] || "";
}

// Country/Destination to Flag Emoji mapping
// For destinations that aren't countries (regions, multi-country, etc.), we use representative flags

export const countryFlags: Record<string, string> = {
  // Africa
  "Botswana": "🇧🇼",
  "Kenya": "🇰🇪",
  "Mauritius": "🇲🇺",
  "Namibia": "🇳🇦",
  "Madagascar": "🇲🇬",
  "Malawi": "🇲🇼",
  "South Africa": "🇿🇦",
  "Rwanda": "🇷🇼",
  "Tanzania": "🇹🇿",
  "Zanzibar": "🇹🇿", // Part of Tanzania
  "Seychelles": "🇸🇨",
  "Uganda": "🇺🇬",
  "Zambia": "🇿🇲",
  "Zimbabwe": "🇿🇼",

  // Asia
  "Bhutan": "🇧🇹",
  "Cambodia": "🇰🇭",
  "China": "🇨🇳",
  "India": "🇮🇳",
  "Indonesia": "🇮🇩",
  "Japan": "🇯🇵",
  "Laos": "🇱🇦",
  "Malaysia": "🇲🇾",
  "Malaysian Borneo": "🇲🇾",
  "Maldives": "🇲🇻",
  "Nepal": "🇳🇵",
  "Philippines": "🇵🇭",
  "Sri Lanka": "🇱🇰",
  "Singapore": "🇸🇬",
  "South Korea": "🇰🇷",
  "The Stans": "🇺🇿", // Using Uzbekistan as representative
  "Kyrgyzstan": "🇰🇬",
  "Uzbekistan": "🇺🇿",
  "Thailand": "🇹🇭",
  "Vietnam": "🇻🇳",
  "Myanmar": "🇲🇲",
  "Tibet": "🇨🇳", // Part of China

  // WEMEA (Western Europe, Middle East, Africa)
  "Iceland": "🇮🇸",
  "Ireland": "🇮🇪",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Portugal": "🇵🇹",
  "Azores": "🇵🇹", // Part of Portugal
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Spain": "🇪🇸",
  "River Cruises": "🚢",
  "Egypt": "🇪🇬",

  // ESE (Europe and Southeast Europe)
  "Austria": "🇦🇹",
  "Belgium": "🇧🇪",
  "Croatia": "🇭🇷",
  "Czech Republic (Prague)": "🇨🇿",
  "France": "🇫🇷",
  "Denmark": "🇩🇰",
  "Germany": "🇩🇪",
  "Greece": "🇬🇷",
  "Hungary (Budapest)": "🇭🇺",
  "Italy": "🇮🇹",
  "Sardinia": "🇮🇹", // Part of Italy
  "Luxembourg": "🇱🇺",
  "Netherlands": "🇳🇱",
  "Norway": "🇳🇴",
  "Sweden": "🇸🇪",
  "Switzerland": "🇨🇭",
  "Multi-Country Trips": "🌍",
  "Orient Express / Trains": "🚂",

  // CANAL (Central America, North America, Latin America)
  "USA - Alaska": "🇺🇸",
  "USA - California": "🇺🇸",
  "USA - Hawaii": "🇺🇸",
  "USA - New England": "🇺🇸",
  "USA - National Parks": "🇺🇸",
  "Antarctica": "🇦🇶",
  "Arctic Svalbard": "🇳🇴", // Svalbard is part of Norway
  "Argentina": "🇦🇷",
  "Belize": "🇧🇿",
  "Bolivia": "🇧🇴",
  "Brazil": "🇧🇷",
  "Canada (East)": "🇨🇦",
  "Canada (West)": "🇨🇦",
  "Colombia": "🇨🇴",
  "Costa Rica": "🇨🇷",
  "Ecuador": "🇪🇨",
  "Chile": "🇨🇱",
  "Galapagos": "🇪🇨", // Part of Ecuador
  "Guatemala": "🇬🇹",
  "Mexico": "🇲🇽",
  "Peru": "🇵🇪",
  "Panama": "🇵🇦",
  "Uruguay": "🇺🇾",
  "Honduras": "🇭🇳",
  "Cuba": "🇨🇺",
  "Paraguay": "🇵🇾",

  // ANZ + Pacific
  "Australia": "🇦🇺",
  "New Zealand": "🇳🇿",
  "Cook Islands": "🇨🇰",
  "Fiji": "🇫🇯",
  "French Polynesia": "🇵🇫",

  // Middle East
  "Israel": "🇮🇱",
  "Jordan": "🇯🇴",
  "Morocco": "🇲🇦",
  "Turkey": "🇹🇷",
  "Oman": "🇴🇲",
  "UAE": "🇦🇪",
};

/**
 * Get the flag emoji for a destination/country name
 * @param name - The destination or country name
 * @returns The flag emoji or an empty string if not found
 */
export function getFlag(name: string): string {
  return countryFlags[name] || "";
}

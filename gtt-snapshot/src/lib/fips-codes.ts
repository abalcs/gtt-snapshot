// FIPS 10-4 to ISO 3166-1 alpha-2 mapping
// The US State Dept travel advisory API uses FIPS country codes.
// This maps them to ISO-2 codes used everywhere else.

const fipsToIso: Record<string, string> = {
  AF: "AF", // Afghanistan
  AL: "AL", // Albania
  AG: "DZ", // Algeria
  AQ: "AS", // American Samoa
  AN: "AD", // Andorra
  AO: "AO", // Angola
  AV: "AI", // Anguilla
  AC: "AG", // Antigua and Barbuda
  AR: "AR", // Argentina
  AM: "AM", // Armenia
  AA: "AW", // Aruba
  AS: "AU", // Australia
  AU: "AT", // Austria
  AJ: "AZ", // Azerbaijan
  BF: "BS", // Bahamas
  BA: "BH", // Bahrain
  BG: "BD", // Bangladesh
  BB: "BB", // Barbados
  BO: "BY", // Belarus
  BE: "BE", // Belgium
  BH: "BZ", // Belize
  BN: "BJ", // Benin
  BD: "BM", // Bermuda
  BT: "BT", // Bhutan
  BL: "BO", // Bolivia
  BK: "BA", // Bosnia and Herzegovina
  BC: "BW", // Botswana
  BR: "BR", // Brazil
  BX: "BN", // Brunei
  BU: "BG", // Bulgaria
  UV: "BF", // Burkina Faso
  BM: "MM", // Burma (Myanmar)
  BY: "BI", // Burundi
  CV: "CV", // Cabo Verde
  CB: "KH", // Cambodia
  CM: "CM", // Cameroon
  CA: "CA", // Canada
  CJ: "KY", // Cayman Islands
  CT: "CF", // Central African Republic
  CD: "TD", // Chad
  CI: "CL", // Chile
  CH: "CN", // China
  CO: "CO", // Colombia
  CN: "KM", // Comoros
  CG: "CD", // Congo (Kinshasa)
  CF: "CG", // Congo (Brazzaville)
  CW: "CK", // Cook Islands
  CS: "CR", // Costa Rica
  IV: "CI", // Cote d'Ivoire
  HR: "HR", // Croatia
  CU: "CU", // Cuba
  UC: "CW", // Curacao
  CY: "CY", // Cyprus
  EZ: "CZ", // Czechia
  DA: "DK", // Denmark
  DJ: "DJ", // Djibouti
  DO: "DM", // Dominica
  DR: "DO", // Dominican Republic
  EC: "EC", // Ecuador
  EG: "EG", // Egypt
  ES: "SV", // El Salvador
  EK: "GQ", // Equatorial Guinea
  ER: "ER", // Eritrea
  EN: "EE", // Estonia
  WZ: "SZ", // Eswatini
  ET: "ET", // Ethiopia
  FJ: "FJ", // Fiji
  FI: "FI", // Finland
  FR: "FR", // France
  GB: "GA", // Gabon
  GA: "GM", // Gambia
  GG: "GE", // Georgia
  GM: "DE", // Germany
  GH: "GH", // Ghana
  GR: "GR", // Greece
  GJ: "GD", // Grenada
  GT: "GT", // Guatemala
  GV: "GN", // Guinea
  PU: "GW", // Guinea-Bissau
  GY: "GY", // Guyana
  HA: "HT", // Haiti
  HO: "HN", // Honduras
  HU: "HU", // Hungary
  IC: "IS", // Iceland
  IN: "IN", // India
  ID: "ID", // Indonesia
  IR: "IR", // Iran
  IZ: "IQ", // Iraq
  EI: "IE", // Ireland
  IS: "IL", // Israel
  IT: "IT", // Italy
  JM: "JM", // Jamaica
  JA: "JP", // Japan
  JO: "JO", // Jordan
  KZ: "KZ", // Kazakhstan
  KE: "KE", // Kenya
  KR: "KI", // Kiribati
  KN: "KP", // North Korea
  KS: "KR", // South Korea
  KU: "KW", // Kuwait
  KG: "KG", // Kyrgyzstan
  LA: "LA", // Laos
  LG: "LV", // Latvia
  LE: "LB", // Lebanon
  LT: "LS", // Lesotho
  LI: "LR", // Liberia
  LY: "LY", // Libya
  LS: "LI", // Liechtenstein
  LH: "LT", // Lithuania
  LU: "LU", // Luxembourg
  MA: "MG", // Madagascar
  MI: "MW", // Malawi
  MY: "MY", // Malaysia
  MV: "MV", // Maldives
  ML: "ML", // Mali
  MT: "MT", // Malta
  RM: "MH", // Marshall Islands
  MR: "MR", // Mauritania
  MP: "MU", // Mauritius
  MX: "MX", // Mexico
  FM: "FM", // Micronesia
  MD: "MD", // Moldova
  MN: "MC", // Monaco
  MG: "MN", // Mongolia
  MJ: "ME", // Montenegro
  MO: "MA", // Morocco
  MZ: "MZ", // Mozambique
  WA: "NA", // Namibia
  NR: "NR", // Nauru
  NP: "NP", // Nepal
  NL: "NL", // Netherlands
  NZ: "NZ", // New Zealand
  NU: "NI", // Nicaragua
  NG: "NE", // Niger
  NI: "NG", // Nigeria
  MK: "MK", // North Macedonia
  NO: "NO", // Norway
  MU: "OM", // Oman
  PK: "PK", // Pakistan
  PS: "PW", // Palau
  PM: "PA", // Panama
  PP: "PG", // Papua New Guinea
  PA: "PY", // Paraguay
  PE: "PE", // Peru
  RP: "PH", // Philippines
  PL: "PL", // Poland
  PO: "PT", // Portugal
  QA: "QA", // Qatar
  RO: "RO", // Romania
  RS: "RU", // Russia
  RW: "RW", // Rwanda
  SC: "KN", // Saint Kitts and Nevis
  ST: "LC", // Saint Lucia
  VC: "VC", // Saint Vincent and the Grenadines
  WS: "WS", // Samoa
  SM: "SM", // San Marino
  TP: "ST", // Sao Tome and Principe
  SA: "SA", // Saudi Arabia
  SG: "SN", // Senegal
  RI: "RS", // Serbia
  SE: "SC", // Seychelles
  SL: "SL", // Sierra Leone
  SN: "SG", // Singapore
  LO: "SK", // Slovakia
  SI: "SI", // Slovenia
  BP: "SB", // Solomon Islands
  SO: "SO", // Somalia
  SF: "ZA", // South Africa
  OD: "SS", // South Sudan
  SP: "ES", // Spain
  CE: "LK", // Sri Lanka
  SU: "SD", // Sudan
  NS: "SR", // Suriname
  SW: "SE", // Sweden
  SZ: "CH", // Switzerland
  SY: "SY", // Syria
  TW: "TW", // Taiwan
  TI: "TJ", // Tajikistan
  TZ: "TZ", // Tanzania
  TH: "TH", // Thailand
  TT: "TL", // Timor-Leste
  TO: "TG", // Togo
  TN: "TO", // Tonga
  TD: "TT", // Trinidad and Tobago
  TS: "TN", // Tunisia
  TU: "TR", // Turkey
  TX: "TM", // Turkmenistan
  TV: "TV", // Tuvalu
  UG: "UG", // Uganda
  UP: "UA", // Ukraine
  AE: "AE", // United Arab Emirates
  UK: "GB", // United Kingdom
  US: "US", // United States
  UY: "UY", // Uruguay
  UZ: "UZ", // Uzbekistan
  NH: "VU", // Vanuatu
  VE: "VE", // Venezuela
  VM: "VN", // Vietnam
  YM: "YE", // Yemen
  ZA: "ZM", // Zambia
  ZI: "ZW", // Zimbabwe
};

/**
 * Convert a FIPS 10-4 country code to ISO 3166-1 alpha-2.
 * Returns null if the FIPS code is not recognized.
 */
export function fipsToIsoCode(fips: string): string | null {
  return fipsToIso[fips.toUpperCase()] ?? null;
}

/**
 * Convert an ISO 3166-1 alpha-2 code to FIPS 10-4.
 * Returns null if no mapping exists.
 */
export function isoToFipsCode(iso: string): string | null {
  const upper = iso.toUpperCase();
  for (const [fips, isoCode] of Object.entries(fipsToIso)) {
    if (isoCode === upper) return fips;
  }
  return null;
}

/**
 * Seed the merged "We Don't Sell" special section.
 * Run: GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/seed-we-dont-sell.ts
 */
import { getDb } from "../db/database";

const US_CONTENT = `### Americas
- Canada to Canadians
- Yukon area of Canada
- Nicaragua
- Caribbean (confirmed as of April 2022) — St. Lucia, Dominican Republic, Jamaica, Cuba, Bahamas, Aruba, Puerto Rico, Curacao, Barbados, St. Maarten, Turks & Caicos

### USA (Domestic)
- Southern USA (Florida, Georgia, South Carolina, North Carolina, etc.)
- Florida
- Washington DC
- Pacific Northwest of USA

### Asia
- Myanmar
- Everest (Nepal)
- Mongolia
- Papua New Guinea

### Europe
- Poland
- Russia

### Middle East & Other
- Afghanistan
- Pakistan
- Nigeria`;

const UK_CONTENT = `### Europe
- Austria
- Belgium
- Denmark
- France
- Germany
- Luxembourg
- Netherlands
- Sweden
- Switzerland

### UK & Ireland
- UK/Ireland/Scotland (The U.S. can sell to UK clients as long as they're okay with signing our SOA)

**UK DOES NOT TAKE SMITHSONIAN LEADS**`;

async function main() {
  const db = getDb();

  // Create the merged doc
  await db.collection("special_sections").doc("we-dont-sell").set({
    title: "We Don't Sell",
    slug: "we-dont-sell",
    content: "Destinations each office does not sell, organized by region.",
    region_scope: null,
    pdf_url: null,
    us_content: US_CONTENT,
    uk_content: UK_CONTENT,
  });

  console.log("Created merged we-dont-sell section");

  // Delete old separate pages
  await db.collection("special_sections").doc("we-dont-sell-us").delete();
  await db.collection("special_sections").doc("uk-doesnt-sell").delete();
  console.log("Deleted old we-dont-sell-us and uk-doesnt-sell sections");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

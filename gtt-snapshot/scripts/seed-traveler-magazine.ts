/**
 * Seed the "Audley Traveler Magazine" special section in Firestore.
 * Run: npx tsx scripts/seed-traveler-magazine.ts
 */
import { getDb } from "../db/database";

async function main() {
  const db = getDb();
  const slug = "audley-traveler-magazine";

  await db.collection("special_sections").doc(slug).set({
    title: "Audley Traveler Magazine",
    slug,
    content: "The Audley Traveler is a seasonal publication showcasing destinations, travel inspiration, and expert insights for advisors and clients.",
    region_scope: null,
    pdf_url: "/publications/traveler-us-autumn-2026.pdf",
  });

  console.log(`Created special section: ${slug}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

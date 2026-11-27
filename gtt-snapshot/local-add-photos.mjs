// Applies header photos to destinations in the LOCAL emulator only.
// Reads app/local/destination-photos.json: { "<slug>": "<image url>", ... }
// Idempotent: only writes when the stored image_url differs.
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const photosPath = join(here, "local", "destination-photos.json");
if (!existsSync(photosPath)) {
  console.log("No destination-photos.json found; skipping photo setup.");
  process.exit(0);
}
const photos = JSON.parse(readFileSync(photosPath, "utf8"));

initializeApp({ projectId: "demo-gtt" });
const db = getFirestore();

let applied = 0;
let present = 0;
const batch = db.batch();
for (const [slug, url] of Object.entries(photos)) {
  const ref = db.collection("destinations").doc(slug);
  const snap = await ref.get();
  if (!snap.exists) continue;
  present++;
  if (snap.data().image_url === url) continue;
  batch.update(ref, { image_url: url });
  applied++;
}
if (applied > 0) await batch.commit();
console.log(`Header photos: ${applied} updated, ${present} destinations found.`);
process.exit(0);

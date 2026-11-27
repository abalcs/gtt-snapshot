// Applies header photos to destinations in the LOCAL emulator only.
// Reads app/local/destination-photos.json: { "<slug>": "<image url>", ... }
// Idempotent: only writes when the stored image_url differs.
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
const base = "http://127.0.0.1:8080/v1/projects/demo-gtt/databases/(default)/documents/destinations";

let applied = 0;
for (const [slug, url] of Object.entries(photos)) {
  try {
    const getRes = await fetch(`${base}/${slug}`);
    if (!getRes.ok) continue; // destination not in this dataset
    const doc = await getRes.json();
    if (doc.fields?.image_url?.stringValue === url) continue;
    const patchRes = await fetch(`${base}/${slug}?updateMask.fieldPaths=image_url`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { image_url: { stringValue: url } } }),
    });
    if (patchRes.ok) applied++;
  } catch {
    // emulator not up yet or doc missing; leave it for the next run
  }
}
console.log(`Header photos: ${applied} destination(s) updated.`);

import Link from "next/link";
import { requireAuth } from "@/lib/admin-auth";
import { getDb } from "@/../db/database";
import { StopSellsClient } from "./stop-sells-client";

export const dynamic = "force-dynamic";

const DEPARTMENT_MAP: Record<string, string> = {
  ese: "ESE",
  wemea: "WEMEA",
  africa: "WEMEA",
  "middle-east": "WEMEA",
  canal: "CANAL",
  "anz-pacific": "CANAL",
  asia: "Asia",
};

export interface StopSellEntry {
  name: string;
  slug: string;
  region_name: string;
  department: string;
  status: string;
  stop_sell_expires: string | null;
  stop_sell_note: string | null;
  urgency: string | null;
}

export default async function StopSellsPage() {
  await requireAuth();

  const snap = await getDb().collection("destinations").get();
  const entries: StopSellEntry[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const urgency = ((data.urgency as string) || "").trim() || null;
    const stopSellExpires = (data.stop_sell_expires as string) || null;
    const status = (data.status as string) || "active";
    const stopSellNote = (data.stop_sell_note as string) || null;

    if (!urgency && !stopSellExpires && status !== "stop_sell") continue;

    const regionSlug = (data.region_slug as string) || "";
    const department = DEPARTMENT_MAP[regionSlug] || "Other";

    entries.push({
      name: (data.name as string) || doc.id,
      slug: doc.id,
      region_name: (data.region_name as string) || "",
      department,
      status,
      stop_sell_expires: stopSellExpires,
      stop_sell_note: stopSellNote,
      urgency,
    });
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span>Current Stop Sells</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Current Stop Sells</h1>
        <p className="text-muted-foreground">
          Destinations currently on stop sell or with active urgency alerts.
        </p>
      </div>

      <StopSellsClient entries={entries} />
    </div>
  );
}

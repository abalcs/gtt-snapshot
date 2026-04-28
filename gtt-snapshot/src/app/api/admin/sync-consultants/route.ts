import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { SEED_CONSULTANTS, slugify, getStaticTaAssignments } from "@/lib/booking-calendars";
import { invalidateCache } from "@/lib/data-cache";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get all existing consultant IDs from Firestore
    const snap = await getDb().collection("consultants").get();
    const existingIds = new Set(snap.docs.map((d) => d.id));

    const now = new Date().toISOString();
    const batch = getDb().batch();
    const added: string[] = [];

    for (const c of SEED_CONSULTANTS) {
      const id = slugify(c.name);
      if (existingIds.has(id)) continue;

      const ref = getDb().collection("consultants").doc(id);
      batch.set(ref, {
        name: c.name,
        title: c.title,
        calendarUrl: c.calendarUrl ?? null,
        destinations: c.destinations,
        displayRegions: c.displayRegions,
        countriesDisplay: c.countriesDisplay,
        taAssignments: getStaticTaAssignments(c.name),
        status: "active",
        created_at: now,
        updated_at: now,
      });
      added.push(c.name);
    }

    if (added.length > 0) {
      await batch.commit();
      invalidateCache("consultants");
    }

    return NextResponse.json({ success: true, added, count: added.length });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

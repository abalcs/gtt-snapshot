import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { SEED_CONSULTANTS, slugify, getStaticTaAssignments } from "@/lib/booking-calendars";

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

    const existing = await getDb().collection("consultants").limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: "Consultants collection already has data. Seed skipped." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const batch = getDb().batch();

    for (const c of SEED_CONSULTANTS) {
      const id = slugify(c.name);
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
    }

    await batch.commit();

    return NextResponse.json({ success: true, count: SEED_CONSULTANTS.length });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

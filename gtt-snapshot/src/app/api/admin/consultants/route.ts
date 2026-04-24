import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { slugify, getStaticTaAssignments } from "@/lib/booking-calendars";
import { invalidateCache } from "@/lib/data-cache";

const COLLECTION = "consultants";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const snap = await getDb().collection(COLLECTION).get();
    const consultants = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        taAssignments: data.taAssignments ?? getStaticTaAssignments(data.name as string),
      };
    });

    return NextResponse.json({ consultants });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { name, title, calendarUrl, destinations, displayRegions, countriesDisplay, disabledDestinations, taAssignments } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const id = slugify(name);
    const existing = await getDb().collection(COLLECTION).doc(id).get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "A consultant with this name already exists" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    await getDb().collection(COLLECTION).doc(id).set({
      name,
      title: title || "",
      calendarUrl: calendarUrl || null,
      destinations: destinations || [],
      displayRegions: displayRegions || [],
      countriesDisplay: countriesDisplay || "",
      disabledDestinations: disabledDestinations || [],
      taAssignments: taAssignments || [],
      status: "active",
      created_at: now,
      updated_at: now,
    });

    invalidateCache("consultants");

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

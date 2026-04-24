import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { slugify } from "@/lib/booking-calendars";
import { invalidateCache } from "@/lib/data-cache";

const COLLECTION = "consultants";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, title, calendarUrl, destinations, displayRegions, countriesDisplay, disabledDestinations, taAssignments } = body;

    const docRef = getDb().collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updated_at: now };

    if (name !== undefined) updates.name = name;
    if (title !== undefined) updates.title = title;
    if (calendarUrl !== undefined) updates.calendarUrl = calendarUrl || null;
    if (destinations !== undefined) updates.destinations = destinations;
    if (displayRegions !== undefined) updates.displayRegions = displayRegions;
    if (countriesDisplay !== undefined) updates.countriesDisplay = countriesDisplay;
    if (disabledDestinations !== undefined) updates.disabledDestinations = disabledDestinations;
    if (taAssignments !== undefined) updates.taAssignments = taAssignments;

    const newId = name ? slugify(name) : id;

    if (newId !== id && name) {
      // Name changed — create new doc, delete old one, migrate booking-clicks
      const existingData = doc.data()!;
      await getDb().collection(COLLECTION).doc(newId).set({
        ...existingData,
        ...updates,
      });
      await docRef.delete();

      // Migrate booking-clicks document
      const clicksRef = getDb().collection("booking-clicks").doc(id);
      const clicksDoc = await clicksRef.get();
      if (clicksDoc.exists) {
        await getDb().collection("booking-clicks").doc(newId).set(clicksDoc.data()!);
        await clicksRef.delete();
      }

      invalidateCache("consultants");
      return NextResponse.json({ success: true, id: newId });
    }

    await docRef.update(updates);
    invalidateCache("consultants");

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const docRef = getDb().collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    }

    const current = doc.data()!;
    const newStatus = current.status === "active" ? "inactive" : "active";

    await docRef.update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    });

    invalidateCache("consultants");

    return NextResponse.json({ success: true, status: newStatus });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const docRef = getDb().collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    }

    await docRef.delete();
    invalidateCache("consultants");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

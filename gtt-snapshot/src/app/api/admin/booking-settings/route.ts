import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { invalidateCache } from "@/lib/data-cache";

const DOC_PATH = "settings/booking-calendars";

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

    const doc = await getDb().doc(DOC_PATH).get();
    const data = doc.data();
    return NextResponse.json({
      disabledDestinations: (data?.disabledDestinations as string[]) ?? [],
    });
  } catch (err) {
    console.error("booking-settings GET error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { slug, action } = await request.json();
    if (!slug || !["disable", "enable"].includes(action)) {
      return NextResponse.json({ error: "slug and action (disable|enable) required" }, { status: 400 });
    }

    const docRef = getDb().doc(DOC_PATH);
    const doc = await docRef.get();
    const current: string[] = (doc.data()?.disabledDestinations as string[]) ?? [];

    let updated: string[];
    if (action === "disable") {
      updated = current.includes(slug) ? current : [...current, slug];
    } else {
      updated = current.filter((s: string) => s !== slug);
    }

    await docRef.set({ disabledDestinations: updated, updated_at: new Date().toISOString() }, { merge: true });

    invalidateCache("booking:disabled-destinations");
    invalidateCache("consultants");

    return NextResponse.json({ success: true, disabledDestinations: updated });
  } catch (err) {
    console.error("booking-settings PUT error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

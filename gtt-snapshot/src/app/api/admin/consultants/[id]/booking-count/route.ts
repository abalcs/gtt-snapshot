import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "booking-clicks";

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
    const { action } = await request.json();

    if (action !== "increment" && action !== "decrement") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const docRef = getDb().collection(COLLECTION).doc(id);

    if (action === "increment") {
      const timestamp = new Date().toISOString();
      await docRef.set(
        { clicks: FieldValue.arrayUnion(timestamp) },
        { merge: true }
      );
      return NextResponse.json({ success: true });
    }

    // Decrement: remove most recent click within 30 days
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "No booking data found" }, { status: 404 });
    }

    const clicks: string[] = doc.data()?.clicks ?? [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString();

    const recentClicks = clicks.filter((ts) => ts >= cutoff);
    if (recentClicks.length === 0) {
      return NextResponse.json({ error: "No recent clicks to remove" }, { status: 400 });
    }

    // Remove the most recent one
    const toRemove = recentClicks[recentClicks.length - 1];
    const updatedClicks = clicks.filter((ts) => ts !== toRemove);
    await docRef.update({ clicks: updatedClicks });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

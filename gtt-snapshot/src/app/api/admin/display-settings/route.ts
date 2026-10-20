import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";

const DOC_PATH = "settings/display";

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
      pricing_visible: data?.pricing_visible ?? true,
    });
  } catch (err) {
    console.error("display-settings GET error:", err);
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

    const { pricing_visible } = await request.json();
    if (typeof pricing_visible !== "boolean") {
      return NextResponse.json({ error: "pricing_visible must be a boolean" }, { status: 400 });
    }

    const docRef = getDb().doc(DOC_PATH);
    await docRef.set(
      { pricing_visible, updated_at: new Date().toISOString() },
      { merge: true }
    );

    return NextResponse.json({ success: true, pricing_visible });
  } catch (err) {
    console.error("display-settings PUT error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

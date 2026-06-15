import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";

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

    const snap = await getDb().collection("destinations").get();
    const results: { slug: string; name: string; urgency: string }[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const urgency = (data.urgency as string) || "";
      if (urgency.trim()) {
        results.push({ slug: doc.id, name: (data.name as string) || doc.id, urgency: urgency.trim() });
      }
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ destinations: results, total: results.length });
  } catch (err) {
    console.error("stop-sells GET error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

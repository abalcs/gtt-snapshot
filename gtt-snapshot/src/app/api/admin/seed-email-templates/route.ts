import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { EMAIL_TEMPLATES, slugifyDestination } from "@/lib/email-templates";

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

    const existing = await getDb().collection("email-templates").limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: "Email templates collection already has data. Seed skipped." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const batch = getDb().batch();

    for (const entry of EMAIL_TEMPLATES) {
      const id = slugifyDestination(entry.destination);
      const ref = getDb().collection("email-templates").doc(id);
      batch.set(ref, {
        destination: entry.destination,
        author: entry.author,
        templates: entry.templates.map((t) => ({
          type: t.type,
          subject: t.subject ?? null,
          body: t.body,
        })),
        created_at: now,
        updated_at: now,
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true, count: EMAIL_TEMPLATES.length });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

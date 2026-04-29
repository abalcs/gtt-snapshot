import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { slugifyDestination } from "@/lib/email-templates";
import { invalidateCache } from "@/lib/data-cache";

const COLLECTION = "email-templates";

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
    const templates = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ templates });
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
    const { destination, author, templates } = body;

    if (!destination) {
      return NextResponse.json({ error: "Destination is required" }, { status: 400 });
    }

    const id = slugifyDestination(destination);
    const existing = await getDb().collection(COLLECTION).doc(id).get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "A template set for this destination already exists" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    await getDb().collection(COLLECTION).doc(id).set({
      destination,
      author: author || "",
      templates: templates || [],
      created_at: now,
      updated_at: now,
    });

    invalidateCache("email-templates");

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

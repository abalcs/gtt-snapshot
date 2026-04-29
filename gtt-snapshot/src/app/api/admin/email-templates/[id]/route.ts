import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { slugifyDestination } from "@/lib/email-templates";
import { invalidateCache } from "@/lib/data-cache";

const COLLECTION = "email-templates";

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
    const { destination, author, templates } = body;

    const docRef = getDb().collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Template set not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updated_at: now };

    if (destination !== undefined) updates.destination = destination;
    if (author !== undefined) updates.author = author;
    if (templates !== undefined) updates.templates = templates;

    const newId = destination ? slugifyDestination(destination) : id;

    if (newId !== id && destination) {
      // Destination name changed — create new doc, delete old one
      const existingData = doc.data()!;
      await getDb().collection(COLLECTION).doc(newId).set({
        ...existingData,
        ...updates,
      });
      await docRef.delete();
      invalidateCache("email-templates");
      return NextResponse.json({ success: true, id: newId });
    }

    await docRef.update(updates);
    invalidateCache("email-templates");

    return NextResponse.json({ success: true, id });
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
      return NextResponse.json({ error: "Template set not found" }, { status: 404 });
    }

    await docRef.delete();
    invalidateCache("email-templates");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

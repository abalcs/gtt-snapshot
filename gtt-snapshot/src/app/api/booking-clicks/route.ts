import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "booking-clicks";

function consultantKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session) return false;
  const user = await validateSession(session.value);
  return !!user;
}

export async function GET() {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const snapshot = await getDb().collection(COLLECTION).get();
  const counts: Record<string, number> = {};

  for (const doc of snapshot.docs) {
    const clicks: string[] = doc.data().clicks ?? [];
    counts[doc.id] = clicks.filter((ts) => ts >= cutoff).length;
  }

  return NextResponse.json(counts);
}

export async function DELETE() {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getDb().collection(COLLECTION).get();
  const batch = getDb().batch();
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();

  return NextResponse.json({ ok: true, deleted: snapshot.size });
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { consultantName } = await request.json();
  if (!consultantName) {
    return NextResponse.json({ error: "consultantName required" }, { status: 400 });
  }

  const key = consultantKey(consultantName);
  const timestamp = new Date().toISOString();

  await getDb()
    .collection(COLLECTION)
    .doc(key)
    .set(
      { name: consultantName, clicks: FieldValue.arrayUnion(timestamp) },
      { merge: true }
    );

  return NextResponse.json({ ok: true });
}

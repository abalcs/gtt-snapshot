import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getSpecialistEntries, seedSpecialistData, updateSpecialistEntry } from "@/lib/specialist-data";

async function requireAdminSession(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) return null;
  const user = await validateSession(sessionCookie.value);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminSession(request);
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const entries = await getSpecialistEntries();
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("specialist-assignments GET error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdminSession(request);
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, specialists } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (!Array.isArray(specialists)) {
      return NextResponse.json({ error: "specialists must be an array" }, { status: 400 });
    }

    await updateSpecialistEntry(id, specialists);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("specialist-assignments PUT error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminSession(request);
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    if (body.action !== "seed") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const count = await seedSpecialistData();
    return NextResponse.json({ success: true, seeded: count });
  } catch (err) {
    console.error("specialist-assignments POST error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

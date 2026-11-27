import { NextRequest, NextResponse } from "next/server";
import { listRevisions } from "@/lib/pages";
import { validateSession } from "@/lib/user-queries";

async function requireAdminApi(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) return null;
  const user = await validateSession(sessionCookie.value);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminApi(request);
  if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { id } = await params;
  try {
    const revisions = await listRevisions(id);
    return NextResponse.json({ revisions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list versions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

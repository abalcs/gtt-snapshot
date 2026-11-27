import { NextRequest, NextResponse } from "next/server";
import { restoreRevision } from "@/lib/pages";
import { validateSession } from "@/lib/user-queries";

async function requireAdminApi(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) return null;
  const user = await validateSession(sessionCookie.value);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  const user = await requireAdminApi(request);
  if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { id, revisionId } = await params;
  try {
    await restoreRevision(id, revisionId, user.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restore version";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

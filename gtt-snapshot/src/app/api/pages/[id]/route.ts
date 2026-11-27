import { NextRequest, NextResponse } from "next/server";
import { deletePage, updatePage } from "@/lib/pages";
import { validateSession } from "@/lib/user-queries";

async function requireAdminApi(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) return null;
  const user = await validateSession(sessionCookie.value);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminApi(request);
  if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    await updatePage(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update page";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminApi(request);
  if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { id } = await params;
  try {
    await deletePage(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete page";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

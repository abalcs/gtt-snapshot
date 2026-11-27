import { NextRequest, NextResponse } from "next/server";
import { createPage, getAllPages } from "@/lib/pages";
import { validateSession } from "@/lib/user-queries";

async function requireAdminApi(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) return null;
  const user = await validateSession(sessionCookie.value);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(request: NextRequest) {
  const user = await requireAdminApi(request);
  if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const pages = await getAllPages();
  return NextResponse.json(pages);
}

export async function POST(request: NextRequest) {
  const user = await requireAdminApi(request);
  if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  try {
    const body = await request.json();
    const page = await createPage(body);
    return NextResponse.json({ success: true, slug: page.slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create page";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

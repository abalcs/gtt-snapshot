import { NextRequest, NextResponse } from "next/server";
import { reorderPages } from "@/lib/pages";
import { validateSession } from "@/lib/user-queries";

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const user = await validateSession(sessionCookie.value);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!Array.isArray(body.ids)) {
      return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
    }
    await reorderPages(body.ids as string[]);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reorder pages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

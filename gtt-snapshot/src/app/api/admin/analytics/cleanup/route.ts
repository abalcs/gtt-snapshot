import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/user-queries";
import { cleanupOldEvents } from "@/lib/analytics-queries";

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session) return false;
  const user = await validateSession(session.value);
  return !!user && user.role === "admin";
}

export async function POST() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await cleanupOldEvents(90);
  return NextResponse.json({ ok: true, deleted });
}

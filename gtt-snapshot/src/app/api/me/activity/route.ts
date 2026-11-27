import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getMyActivity } from "@/lib/my-activity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const user = await validateSession(sessionCookie.value);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const activity = await getMyActivity(user.email);
  return NextResponse.json(activity);
}

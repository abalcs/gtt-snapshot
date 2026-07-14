import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/user-queries";
import { getDashboardData } from "@/lib/analytics-queries";

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session) return false;
  const user = await validateSession(session.value);
  return !!user && user.role === "admin";
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = parseInt(searchParams.get("range") ?? "30", 10);
  const validRange = [7, 30, 90].includes(range) ? range : 30;

  const data = await getDashboardData(validRange);
  return NextResponse.json(data);
}

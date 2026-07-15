import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/user-queries";
import { getDashboardData, getDashboardDataV2 } from "@/lib/analytics-queries";

async function verifyAdmin(): Promise<boolean> {
  if (process.env.BYPASS_AUTH === "true") return true;
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
  const version = searchParams.get("v") ?? "1";
  const range = parseInt(searchParams.get("range") ?? "30", 10);
  const validRange = Math.min(Math.max(range, 1), 365);

  if (version === "2") {
    const data = await getDashboardDataV2(validRange);
    return NextResponse.json(data);
  }

  const data = await getDashboardData(validRange);
  return NextResponse.json(data);
}

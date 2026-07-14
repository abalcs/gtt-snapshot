import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { recordEventBatch } from "@/lib/analytics-queries";
import type { AnalyticsEvent } from "@/lib/analytics-types";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Handle both JSON and sendBeacon text payloads
    const contentType = request.headers.get("content-type") ?? "";
    let events: AnalyticsEvent[];

    if (contentType.includes("application/json")) {
      const body = await request.json();
      events = body.events;
    } else {
      // sendBeacon sends as text/plain
      const text = await request.text();
      const body = JSON.parse(text);
      events = body.events;
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "No events provided" }, { status: 400 });
    }

    // Cap batch size to prevent abuse
    const capped = events.slice(0, 100);

    await recordEventBatch({
      user_email: user.email,
      user_name: user.name,
      flushed_at: new Date().toISOString(),
      events: capped,
    });

    return NextResponse.json({ ok: true, count: capped.length });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

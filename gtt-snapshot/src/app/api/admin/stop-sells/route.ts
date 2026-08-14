import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { invalidateCache } from "@/lib/data-cache";

async function requireAdminSession(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) {
    return null;
  }
  const user = await validateSession(sessionCookie.value);
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminSession(request);
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const snap = await getDb().collection("destinations").get();
    const results: {
      slug: string;
      name: string;
      region_name: string;
      region_slug: string;
      urgency: string | null;
      status: string;
      stop_sell_expires: string | null;
      stop_sell_note: string | null;
    }[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const urgency = ((data.urgency as string) || "").trim() || null;
      const stopSellExpires = (data.stop_sell_expires as string) || null;
      const status = (data.status as string) || "active";

      // Include if has urgency, stop_sell_expires, or status is stop_sell
      if (urgency || stopSellExpires || status === "stop_sell") {
        results.push({
          slug: doc.id,
          name: (data.name as string) || doc.id,
          region_name: (data.region_name as string) || "",
          region_slug: (data.region_slug as string) || "",
          urgency,
          status,
          stop_sell_expires: stopSellExpires,
          stop_sell_note: (data.stop_sell_note as string) || null,
        });
      }
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ destinations: results, total: results.length });
  } catch (err) {
    console.error("stop-sells GET error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdminSession(request);
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { slug, stop_sell_expires, stop_sell_note, urgency } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const docRef = getDb().collection("destinations").doc(slug);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (stop_sell_expires !== undefined) {
      updateData.stop_sell_expires = stop_sell_expires || null;
    }
    if (stop_sell_note !== undefined) {
      updateData.stop_sell_note = stop_sell_note || null;
    }
    if (urgency !== undefined) {
      updateData.urgency = urgency || null;
    }

    await docRef.update(updateData);
    invalidateCache();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("stop-sells PUT error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminSession(request);
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    if (body.action !== "clear-expired") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const snap = await getDb().collection("destinations").get();
    const batch = getDb().batch();
    let cleared = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      const expires = data.stop_sell_expires as string | undefined;
      if (expires && expires < today) {
        batch.update(doc.ref, {
          stop_sell_expires: null,
          stop_sell_note: null,
          urgency: null,
          updated_at: new Date().toISOString(),
        });
        cleared++;
      }
    }

    if (cleared > 0) {
      await batch.commit();
      invalidateCache();
    }

    return NextResponse.json({ success: true, cleared });
  } catch (err) {
    console.error("stop-sells POST error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

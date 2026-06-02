import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { TCE_ARTICLES } from "@/lib/tce-data";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const existing = await getDb().collection("tce-articles").limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: "TCE articles collection already has data. Seed skipped." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const batch = getDb().batch();

    for (const article of TCE_ARTICLES) {
      const ref = getDb().collection("tce-articles").doc(article.slug);
      batch.set(ref, {
        title: article.title,
        category: article.category,
        content: article.content,
        sort_order: article.sort_order,
        created_at: now,
        updated_at: now,
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true, count: TCE_ARTICLES.length });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

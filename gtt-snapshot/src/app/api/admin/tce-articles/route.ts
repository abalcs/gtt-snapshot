import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getTceArticles, createTceArticle } from "@/lib/tce-queries";
import { getDb } from "@/../db/database";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const articles = await getTceArticles();
    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { slug, title, category, content, sort_order } = body;

    if (!slug || !title || !category) {
      return NextResponse.json({ error: "slug, title, and category are required" }, { status: 400 });
    }

    const existing = await getDb().collection("tce-articles").doc(slug).get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "An article with this slug already exists" },
        { status: 409 }
      );
    }

    const id = await createTceArticle({
      slug,
      title,
      category,
      content: content || "",
      sort_order: sort_order ?? 0,
    });

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

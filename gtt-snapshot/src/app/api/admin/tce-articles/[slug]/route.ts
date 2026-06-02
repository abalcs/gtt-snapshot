import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { updateTceArticle, deleteTceArticle } from "@/lib/tce-queries";
import { getDb } from "@/../db/database";

const COLLECTION = "tce-articles";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { slug } = await params;
    const body = await request.json();

    const docRef = getDb().collection(COLLECTION).doc(slug);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await updateTceArticle(slug, {
      title: body.title,
      category: body.category,
      content: body.content,
      sort_order: body.sort_order,
    });

    return NextResponse.json({ success: true, slug });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { slug } = await params;
    const docRef = getDb().collection(COLLECTION).doc(slug);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await deleteTceArticle(slug);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

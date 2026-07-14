import { NextRequest, NextResponse } from 'next/server';
import { getAllTagDefinitions, createTagDefinition } from '@/lib/queries';
import { validateSession } from '@/lib/user-queries';

export async function GET() {
  try {
    const tags = await getAllTagDefinitions();
    return NextResponse.json(tags);
  } catch (error) {
    void error;
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await request.json();
    const { slug, label, category } = body;

    if (!slug || !label || !category) {
      return NextResponse.json({ error: 'slug, label, and category are required' }, { status: 400 });
    }

    await createTagDefinition({ slug, label, category });
    return NextResponse.json({ slug }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

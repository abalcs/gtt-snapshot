import { NextRequest, NextResponse } from 'next/server';
import { getSpecialSectionBySlug, updateSpecialSection, deleteSpecialSection } from '@/lib/queries';
import { validateSession } from '@/lib/user-queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const section = await getSpecialSectionBySlug(slug);
  if (!section) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(section);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await request.json();
    await updateSpecialSection(slug, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    await deleteSpecialSection(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

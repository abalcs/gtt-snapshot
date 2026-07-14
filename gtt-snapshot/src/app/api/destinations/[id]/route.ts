import { NextRequest, NextResponse } from 'next/server';
import { getDestinationById, updateDestination, deleteDestination, upsertPricingTiers } from '@/lib/queries';
import { validateSession } from '@/lib/user-queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dest = await getDestinationById(id);
  if (!dest) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(dest);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await request.json();
    const { pricing_tiers, pricing_footnotes, ...destData } = body;

    await updateDestination(id, destData);

    if (pricing_tiers && Array.isArray(pricing_tiers)) {
      await upsertPricingTiers(id, pricing_tiers, pricing_footnotes);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    await deleteDestination(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

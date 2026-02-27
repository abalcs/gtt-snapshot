import { NextRequest, NextResponse } from 'next/server';
import { updateTagDefinition, deleteTagDefinition } from '@/lib/queries';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const update: Record<string, string> = {};
    if (body.label) update.label = body.label;
    if (body.category) update.category = body.category;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await updateTagDefinition(slug, update);
    return NextResponse.json({ slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await deleteTagDefinition(slug);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

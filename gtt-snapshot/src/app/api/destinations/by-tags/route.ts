import { NextRequest, NextResponse } from 'next/server';
import { getDestinationsByTags } from '@/lib/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tagsParam = searchParams.get('tags');
  const region = searchParams.get('region') || undefined;

  if (!tagsParam) {
    return NextResponse.json({ destinations: [] });
  }

  const tagSlugs = tagsParam.split(',').map(s => s.trim()).filter(Boolean);
  if (tagSlugs.length === 0) {
    return NextResponse.json({ destinations: [] });
  }

  const destinations = await getDestinationsByTags(tagSlugs, region);
  return NextResponse.json({ destinations });
}

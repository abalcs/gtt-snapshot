import { NextRequest, NextResponse } from 'next/server';
import { getDestinationsByTags } from '@/lib/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tagsParam = searchParams.get('tags');
  const seasonsParam = searchParams.get('seasons');
  const region = searchParams.get('region') || undefined;

  const tagSlugs = tagsParam ? tagsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
  const seasonSlugs = seasonsParam ? seasonsParam.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (tagSlugs.length === 0 && seasonSlugs.length === 0) {
    return NextResponse.json({ destinations: [] });
  }

  const destinations = await getDestinationsByTags(tagSlugs, seasonSlugs, region);
  return NextResponse.json({ destinations });
}

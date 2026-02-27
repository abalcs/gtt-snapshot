import { NextRequest, NextResponse } from 'next/server';
import { searchDestinations, searchSpecialSections } from '@/lib/queries';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  if (q.trim().length < 2) {
    return NextResponse.json({ destinations: [], specialSections: [] });
  }

  try {
    const [destinations, specialSections] = await Promise.all([
      searchDestinations(q),
      searchSpecialSections(q),
    ]);
    return NextResponse.json({ destinations, specialSections });
  } catch {
    return NextResponse.json({ destinations: [], specialSections: [] });
  }
}

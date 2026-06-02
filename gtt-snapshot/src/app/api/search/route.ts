import { NextRequest, NextResponse } from 'next/server';
import { searchDestinations, searchSpecialSections } from '@/lib/queries';
import { getTceArticles } from '@/lib/tce-queries';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  if (q.trim().length < 2) {
    return NextResponse.json({ destinations: [], specialSections: [], tceArticles: [] });
  }

  try {
    const lower = q.toLowerCase();

    const [allArticles, destinations, specialSections] = await Promise.all([
      getTceArticles(),
      searchDestinations(q),
      searchSpecialSections(q),
    ]);

    const tceArticles = allArticles
      .filter((a) => a.title.toLowerCase().includes(lower) || a.content.toLowerCase().includes(lower))
      .map((a) => ({ title: a.title, slug: a.slug, category: a.category }));

    return NextResponse.json({ destinations, specialSections, tceArticles });
  } catch {
    return NextResponse.json({ destinations: [], specialSections: [], tceArticles: [] });
  }
}

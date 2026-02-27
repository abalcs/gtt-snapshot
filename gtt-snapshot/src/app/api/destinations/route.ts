import { NextRequest, NextResponse } from 'next/server';
import { getAllDestinations, createDestination, upsertPricingTiers } from '@/lib/queries';

export async function GET() {
  try {
    const destinations = await getAllDestinations();
    return NextResponse.json(destinations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 });
    void error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pricing_tiers, ...destData } = body;

    const id = await createDestination(destData);

    if (pricing_tiers && Array.isArray(pricing_tiers)) {
      await upsertPricingTiers(id, pricing_tiers);
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create destination';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

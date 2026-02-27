import { NextRequest } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GlobalTravelFTW!';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid password' }, { status: 401 });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

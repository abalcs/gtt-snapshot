import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GlobalTravelFTW!';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password === ADMIN_PASSWORD) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const cookie = `admin_auth=authenticated; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${secure}`;
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GlobalTravelFTW!';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password === ADMIN_PASSWORD) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const cookie = `admin_auth=authenticated; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${secure}`;
    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', cookie);
    return response;
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}

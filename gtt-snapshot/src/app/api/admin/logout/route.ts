import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/user-queries';

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session');

  if (sessionCookie?.value) {
    await deleteSession(sessionCookie.value);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('__session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

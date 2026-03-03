import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getUserByEmail, createUser } from '@/lib/user-queries';
import { sendInviteEmail } from '@/lib/email';

const DEFAULT_PASSWORD = 'GTT2026LFG!';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const inviter = await validateSession(sessionCookie.value);
    if (!inviter || inviter.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email, name } = await request.json();
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    await createUser(email, name, DEFAULT_PASSWORD, 'advisor', inviter.email, true);
    await sendInviteEmail(email, inviter.name);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

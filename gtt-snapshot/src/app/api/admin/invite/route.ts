import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getUserByEmail, createUser } from '@/lib/user-queries';

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

    const { email, name, password, role } = await request.json();
    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const userRole = role === 'admin' ? 'admin' : 'advisor';

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    await createUser(email, name, password, userRole, inviter.email, true);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

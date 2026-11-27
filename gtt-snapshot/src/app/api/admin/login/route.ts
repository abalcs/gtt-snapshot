import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, createSession } from '@/lib/user-queries';

export async function POST(request: NextRequest) {
  try {
    const { email, password, remember } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status === 'deactivated') {
      return NextResponse.json({ error: 'Account has been deactivated' }, { status: 401 });
    }

    const valid = await verifyPassword(user, password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionHours = remember ? 24 * 30 : 24;
    const token = await createSession(user.id, sessionHours);

    const response = NextResponse.json({
      success: true,
      must_change_password: user.must_change_password,
      user: { name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set('__session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * sessionHours, // 24 hours, or 30 days with 'keep me signed in'
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

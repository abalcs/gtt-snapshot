import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getAllUsers } from '@/lib/user-queries';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = await getAllUsers();

    // Strip password hashes before returning
    const safeUsers = users.map(({ password_hash, ...rest }) => rest);

    return NextResponse.json({ users: safeUsers });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

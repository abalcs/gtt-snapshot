import { NextRequest, NextResponse } from 'next/server';
import { validateSession, updateUserStatus, updateUserRole, getUserById, adminResetPassword } from '@/lib/user-queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get('__session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const admin = await validateSession(sessionCookie.value);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const targetUser = await getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === admin.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }

    // Handle reset_password action
    if (body.action === 'reset_password') {
      const tempPassword = body.temp_password;
      if (!tempPassword || tempPassword.length < 6) {
        return NextResponse.json({ error: 'Temporary password must be at least 6 characters' }, { status: 400 });
      }

      await adminResetPassword(id, tempPassword);
      return NextResponse.json({ success: true });
    }

    // Handle role update
    if (body.role) {
      if (body.role !== 'admin' && body.role !== 'advisor') {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      await updateUserRole(id, body.role);
      return NextResponse.json({ success: true });
    }

    // Handle status update (existing behavior)
    const { status } = body;
    if (status !== 'active' && status !== 'deactivated') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await updateUserStatus(id, status);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

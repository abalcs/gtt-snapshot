import { NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/lib/user-queries';

export async function POST() {
  try {
    const users = await getAllUsers();

    if (users.length > 0) {
      return NextResponse.json({ error: 'Users already exist. Seed is not needed.' }, { status: 400 });
    }

    await createUser(
      'alan.balcom@audleytravel.com',
      'Alan Balcom',
      'GTT2026LFG!',
      'admin',
      null,
      false // no forced password change for initial admin
    );

    return NextResponse.json({ success: true, message: 'Admin user created' });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

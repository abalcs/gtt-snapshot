import { NextRequest, NextResponse } from 'next/server';
import { validateSession, updateUserPassword, generateRecoveryCodes, saveRecoveryCodes } from '@/lib/user-queries';

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { password } = await request.json();
    if (!password || !PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with a letter, number, and special character' },
        { status: 400 }
      );
    }

    await updateUserPassword(user.id, password);

    const { plaintext, hashed } = await generateRecoveryCodes();
    await saveRecoveryCodes(user.id, hashed);

    return NextResponse.json({ success: true, recovery_codes: plaintext });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

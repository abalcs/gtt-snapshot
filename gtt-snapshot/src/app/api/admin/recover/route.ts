import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByEmail,
  verifyAndConsumeRecoveryCode,
  updateUserPassword,
  generateRecoveryCodes,
  saveRecoveryCodes,
} from '@/lib/user-queries';

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

export async function POST(request: NextRequest) {
  try {
    const { email, recovery_code, new_password } = await request.json();

    if (!email || !recovery_code || !new_password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!PASSWORD_REGEX.test(new_password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with a letter, number, and special character' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({ error: 'Invalid email or recovery code' }, { status: 400 });
    }

    if (user.status === 'deactivated') {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    const valid = await verifyAndConsumeRecoveryCode(user.id, recovery_code);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or recovery code' }, { status: 400 });
    }

    // Update password (must_change_password = false since they just chose it)
    await updateUserPassword(user.id, new_password);

    // Generate new recovery codes
    const { plaintext, hashed } = await generateRecoveryCodes();
    await saveRecoveryCodes(user.id, hashed);

    return NextResponse.json({ success: true, recovery_codes: plaintext });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

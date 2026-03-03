import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const APP_URL = process.env.APP_URL || 'https://gtt-country-snapshot.web.app';
const DEFAULT_PASSWORD = 'GTT2026LFG!';

export async function sendInviteEmail(to: string, invitedByName: string): Promise<void> {
  await getResend().emails.send({
    from: 'GTT Country Snapshot <noreply@audleytravel.com>',
    to,
    subject: 'You\'ve been invited to GTT Country Snapshot',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="background-color: #3a5f54; padding: 24px 32px;">
          <h1 style="color: white; margin: 0; font-family: Georgia, serif; font-size: 20px;">GTT Country Snapshot</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 14px;">Audley Travel</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 16px;">
            ${invitedByName} has invited you to GTT Country Snapshot, Audley Travel's destination reference guide.
          </p>
          <p style="font-size: 14px; color: #555; margin: 0 0 8px;">Your login credentials:</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
            <p style="font-size: 14px; color: #333; margin: 0 0 4px;"><strong>Email:</strong> ${to}</p>
            <p style="font-size: 14px; color: #333; margin: 0;"><strong>Password:</strong> ${DEFAULT_PASSWORD}</p>
          </div>
          <p style="font-size: 14px; color: #555; margin: 0 0 24px;">
            You'll be asked to set a new password when you first log in.
          </p>
          <a href="${APP_URL}/login" style="display: inline-block; background-color: #3a5f54; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">
            Sign in to GTT Country Snapshot
          </a>
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; margin: 0;">Audley Travel &mdash; GTT Country Snapshot</p>
        </div>
      </div>
    `,
  });
}

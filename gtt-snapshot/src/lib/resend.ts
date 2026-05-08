import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface FeedbackEmailParams {
  recipientEmails: string[];
  userName: string;
  userEmail: string;
  category: string;
  message: string;
  pageUrl: string;
}

const categoryLabels: Record<string, string> = {
  "edit-suggestion": "Edit Suggestion",
  "feature-request": "Feature Request",
  general: "General",
};

export async function sendFeedbackEmail({
  recipientEmails,
  userName,
  userEmail,
  category,
  message,
  pageUrl,
}: FeedbackEmailParams): Promise<void> {
  const resend = getResend();
  if (!resend || recipientEmails.length === 0) return;

  const label = categoryLabels[category] || category;

  await resend.emails.send({
    from: "GTT Snapshot <onboarding@resend.dev>",
    to: recipientEmails,
    subject: `[GTT Feedback] ${label} from ${userName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">New Feedback Submission</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 100px;">Category</td>
              <td style="padding: 8px 0;"><strong>${label}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">From</td>
              <td style="padding: 8px 0;">${userName} (${userEmail})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Page</td>
              <td style="padding: 8px 0;"><a href="${pageUrl}">${pageUrl}</a></td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <div style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            <a href="https://gtt-country-snapshot.web.app/admin/feedback">View in Admin Dashboard</a>
          </p>
        </div>
      </div>
    `,
  });
}

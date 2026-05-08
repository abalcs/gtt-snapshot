import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { sendFeedbackEmail } from "@/lib/resend";

const VALID_CATEGORIES = ["edit-suggestion", "feature-request", "general"];

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { category, message, page_url } = body;

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const doc = {
      user_name: user.name,
      user_email: user.email,
      category,
      message: message.trim(),
      page_url: page_url || null,
      status: "new",
      admin_notes: null,
      created_at: now,
      updated_at: now,
    };

    const ref = await getDb().collection("feedback").add(doc);

    // Send email notification (non-blocking — failure doesn't affect response)
    try {
      const recipientsSnap = await getDb().collection("feedback-recipients").get();
      const recipientEmails = recipientsSnap.docs.map((d) => d.data().email);

      if (recipientEmails.length > 0) {
        await sendFeedbackEmail({
          recipientEmails,
          userName: user.name,
          userEmail: user.email,
          category,
          message: message.trim(),
          pageUrl: page_url || "",
        });
      }
    } catch {
      // Email failure is non-critical
    }

    return NextResponse.json({ success: true, id: ref.id });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

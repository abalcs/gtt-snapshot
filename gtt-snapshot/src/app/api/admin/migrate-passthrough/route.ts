import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { invalidateCache } from "@/lib/data-cache";

const APPEND_CONTENT = `

## GTT Passthrough Verify

Use these screenshots to ensure you get credit on the passthrough report!

From the quote page (after you've converted your enquiry to quote and have passed into team):

1. Click into the **Trip** number to open the trip details.

![Click into the Trip number](/images/tce/passthrough-trip-click.png)

2. Scroll down and ensure the **Last GTT Action By** and **Passthrough to Sales Date** fields have populated. If they have not, manually input the information.

![Verify Last GTT Action By and Passthrough to Sales Date fields](/images/tce/passthrough-fields.png)
`;

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const docRef = getDb().collection("tce-articles").doc("best-practices");
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "best-practices article not found" }, { status: 404 });
    }

    const data = doc.data()!;
    const content = (data.content as string) || "";

    if (content.includes("GTT Passthrough Verify")) {
      return NextResponse.json({ success: true, status: "already present" });
    }

    await docRef.update({
      content: content + APPEND_CONTENT,
      updated_at: new Date().toISOString(),
    });

    invalidateCache("tce-articles");

    return NextResponse.json({ success: true, status: "appended" });
  } catch (err) {
    console.error("migrate-passthrough error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

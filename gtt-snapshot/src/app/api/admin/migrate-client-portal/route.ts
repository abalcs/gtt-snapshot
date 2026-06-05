import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { invalidateCache } from "@/lib/data-cache";

const CLIENT_PORTAL_ARTICLE = {
  slug: "client-portal-guide",
  title: "Client Portal Guide",
  category: "client-portal",
  sort_order: 16,
  content: `## High Level — Known Issues and Current Workaround

| Issue | Ability to Resolve on Portal | Workaround |
|---|---|---|
| Can't log in / password issue | Yes | N/A |
| Trips not showing in the account | No, waiting for resolution | No |
| Can't share trip | Unsure, no known bug but clients are having issues | Yes, can share for them via CRM |
| Can't load Passport details | No, waiting for bug to be resolved | Yes, can load for them via CRM |
| Can't sign T&C | Resolved | No workaround |
| Can't make payment | No, have them submit IT ticket | Yes, transfer to sales to pay via phone or pay by link |

## How to Diagnose a Client Not Being Able to Sign In

**Step One:** Log on to [Auth0](https://manage.auth0.com/) and navigate to User Management > Users

![Auth0 Dashboard — User Management](/images/tce/auth0-dashboard.png)

**Step Two:** Search for the client email

![Auth0 Users — Search for client email](/images/tce/auth0-search.png)

![Auth0 Users — Search result](/images/tce/auth0-search-result.png)

**Step Three:** Check if the client is Verified or Unverified

![Auth0 User Detail — Verified/Unverified status](/images/tce/auth0-verified.png)

**If it is not verified and the client needs to be resent the email, you can do that with the drop-down menu.**

**Video Demo:** Recap: Client Portal — clients not being able to log in (Thursday, June 4 | Microsoft Teams)

## Client Can't Share Trip With Their Travelling Companion

### Client Portal Instructions for the Client

**Step one:** Log into the portal

**Step two:** Click on the airplane icon

**Step three:** Click on the trip you want to share

**Step four:** Click on **Invite Passengers**

**Step five:** Client can type in the name and email of the travel companion they want to share with

## POC Structure with Email Templates

### POC #1 (Day One) — Contact the client to advise you are aware of the issue and the resolution and/or next steps

**EMAIL TEMPLATE:**

Hi [Client Name],

Thank you for contacting us. I understand you're experiencing an issue with [brief description of issue] in your MyAudley account, and I'm happy to help.

**If solution is known:**
To resolve this, please [insert solution/next step clearly].

**If you tried calling instead:**
I also tried calling you to help resolve this quickly. When convenient, please call me back at [phone number], and I'd be glad to assist.

If you'd prefer, you can also reply to this email with a good time to reach you.

Thank you,
[Your Name]

### POC #2 (3 Days Later) — If you still haven't heard from the client

**EMAIL TEMPLATE:**

Hi [Client Name],

I'm following up to see if you still need any assistance with your MyAudley account issue.

If you no longer need support, please let me know no further action is needed. If you would still like help, I'd be happy to arrange a phone call or continue assisting by email — whichever is most convenient for you.

Thank you,
[Your Name]

### POC #3 (3 Days Later) — Close the case if you have not heard from the client AND you have provided a solve or resolved the issue in the background

**EMAIL TEMPLATE:**

Hi [Client Name],

I'm following up regarding your MyAudley account issue. As we haven't heard back from you, we will not be reaching out further at this time.

If you still need assistance, please feel free to reply to this email or contact us, and we'd be happy to help.

Thank you,
[Your Name]

## Help Sharing Your Trip — Email Template

**Subject:** Help sharing your trip with your traveling companion

Hi [Client Name],

Thank you for contacting us. I understand you're having trouble sharing your trip with the other passengers traveling with you in your MyAudley account. This is a known issue, and I'm happy to help.

Below is a step-by-step guide showing how you can share your trip through the MyAudley portal:

- **Step one:** Log into your portal
- **Step two:** Click on **Trips**
- **Step three:** Click on the trip you want to share
- **Step four:** Click on **Invite Passengers** and type in the name of the person you want to share the trip with as well as their email. They will receive an email from Audley with next steps to view the trip.

## General Email Contact Template

**Subject:** Follow-Up Regarding Your My Audley Account

My name is XXX, and I am part of the team at Audley Travel. I understand that you recently submitted a case regarding an issue with XXX. I attempted to reach you by phone and left a voicemail, and I wanted to follow up via email as well.

I would appreciate the opportunity to gather a bit more detail regarding the issue so that I can ensure it is addressed appropriately and in a timely manner. As you may be aware, our new My Audley was recently launched, and we are actively working to resolve any issues that arise.

Please feel free to reply at your convenience or reach out directly if you prefer. My direct line is 617-223-4924.

I look forward to assisting you further.

## Client Portal FAQ

**What do I do if a client is reaching out asking for a CSQ to fill out?**
Please reassign the case to the CEX queue called **Client Engagement US** and this is something their team can help with.

**Can only the lead client make payments on the portal?**
No, other passengers on the trip can also make payments. It's only the deposit that can only be done via one payment. If the clients want to split the deposit, they will need to do this over the phone with a CS.`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

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

    const docRef = getDb().collection("tce-articles").doc(CLIENT_PORTAL_ARTICLE.slug);
    await docRef.set({ ...CLIENT_PORTAL_ARTICLE, updated_at: new Date().toISOString() }, { merge: true });
    invalidateCache("tce-articles");

    return NextResponse.json({ success: true, status: "updated" });
  } catch (err) {
    console.error("migrate-client-portal error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

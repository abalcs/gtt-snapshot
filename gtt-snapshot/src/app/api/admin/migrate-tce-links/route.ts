import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { invalidateCache } from "@/lib/data-cache";

interface LinkReplace {
  slug: string;
  find: string;
  replace: string;
}

const REPLACEMENTS: LinkReplace[] = [
  // --- tce-cutover ---
  {
    slug: "tce-cutover",
    find: "Follow the Day One Checklist provided",
    replace: "Follow the [Day One Checklist](https://audleytravelonline.sharepoint.com/sites/Destination2026/Learn%20more%20about%20TCE/Forms/AllItems.aspx?id=%2Fsites%2FDestination2026%2FLearn%20more%20about%20TCE%2FDay%20One%20%26%20Support%2FTCE%20Key%20Actions%20and%20Day%20One%20Checklist%20%2D%20FINAL%2Epdf&parent=%2Fsites%2FDestination2026%2FLearn%20more%20about%20TCE%2FDay%20One%20%26%20Support) provided",
  },

  // --- reference-guides ---
  {
    slug: "reference-guides",
    find: "**Enquiry to Quote Processes**",
    replace: "**[Enquiry to Quote Processes](https://audleytravelonline-my.sharepoint.com/:p:/g/personal/rachael_wood_audleytravel_com/IQA6o2q488NUR6_VQZmo5ZDXAbVE_7D4tyifJvSxUh6IBvA?e=6bPhS8)**",
  },
  {
    slug: "reference-guides",
    find: "includes Trade and Partnerships guide",
    replace: "includes [Trade and Partnerships guide](https://audleytravelonline.sharepoint.com/:w:/s/USPartnerships/IQB8grl_YipMQ4dtV8D4gL2QAXOYdMiu0usAvCrCc0k2_dM?e=LevG0D)",
  },
  {
    slug: "reference-guides",
    find: "**Closing an Enquiry**",
    replace: "**[Closing an Enquiry](https://audleytravelonline-my.sharepoint.com/:w:/g/personal/rachael_wood_audleytravel_com/IQA1X77RQFU9QIoNyAFOe8VuAbwdA7yQMix-tvC2N8Q7wuk?e=WWqPeJ)**",
  },
  {
    slug: "reference-guides",
    find: "**How to: Additional Processes**",
    replace: "**[How to: Additional Processes](https://audleytravelonline-my.sharepoint.com/:p:/g/personal/rachael_wood_audleytravel_com/IQC08u9hS9biTq3DN9WejJWNAcAXUpTYz4omFU18kqvCmAE?e=kXJql2)**",
  },
  {
    slug: "reference-guides",
    find: "**How to: Create a Case**",
    replace: "**[How to: Create a Case](https://audleytravelonline-my.sharepoint.com/:p:/g/personal/rachael_wood_audleytravel_com/IQB67ppiewIZSrERPP9BU4tDATB31VkT12soL2hAyImKRCU?e=dVE3sy)**",
  },

  // --- reference-videos ---
  {
    slug: "reference-videos",
    find: "- How To: Create a New Enquiry",
    replace: "- [How To: Create a New Enquiry](https://audleytravelonline-my.sharepoint.com/:v:/g/personal/rachael_wood_audleytravel_com/IQCv1NuCG3hoQ758z3nRY47-AQoSNfpyd-nA4e0axh02-ds?e=oBZUxE)",
  },
  {
    slug: "reference-videos",
    find: "- How To: New Enquiry to Qualify Enquiry",
    replace: "- [How To: New Enquiry to Qualify Enquiry](https://audleytravelonline-my.sharepoint.com/:v:/g/personal/rachael_wood_audleytravel_com/IQAHaFjXft5uTLnif-6Wu64gAVgnsSF5UBAvALqgbXuKRPs?e=s2vfMj)",
  },
  {
    slug: "reference-videos",
    find: "- How To: Create a new Travel Agent Contact for Existing Travel Agency",
    replace: "- [How To: Create a new Travel Agent Contact for Existing Travel Agency](https://audleytravelonline-my.sharepoint.com/:v:/g/personal/rachael_wood_audleytravel_com/IQAkMANzq9C3QYjKeuWA3Sb2AV1Nb0Z6P1jU9XIDjVmLB2E?e=tzQOO4)",
  },
  {
    slug: "reference-videos",
    find: "- How To: Create a new Travel Agent Enquiry",
    replace: "- [How To: Create a new Travel Agent Enquiry](https://audleytravelonline-my.sharepoint.com/:v:/g/personal/rachael_wood_audleytravel_com/IQCMzjJAf90yS49nl3L3yhTAAYSX5gIRyxBENrFqovhqVEw?e=5mAx58)",
  },
  {
    slug: "reference-videos",
    find: "- How To: Create a Case",
    replace: "- [How To: Create a Case](https://audleytravelonline-my.sharepoint.com/:v:/g/personal/rachael_wood_audleytravel_com/IQAXTscgOUYASJv9F8A0QtsQAZ9F2fK8wa3M5h13j1YfLyw?e=YX7zP5)",
  },

  // --- how-to-raise-a-case: add links at end ---
  {
    slug: "how-to-raise-a-case",
    find: "The case will be automatically assigned to the Client Engagement US queue.",
    replace: "The case will be automatically assigned to the Client Engagement US queue.\n\n**Resources:**\n- [How to Raise a Case - Guide](https://audleytravelonline-my.sharepoint.com/:p:/g/personal/rachael_wood_audleytravel_com/IQB67ppiewIZSrERPP9BU4tDATB31VkT12soL2hAyImKRCU?e=chvcFq)\n- [How to Raise a Case - Video](https://audleytravelonline-my.sharepoint.com/:v:/g/personal/rachael_wood_audleytravel_com/IQAXTscgOUYASJv9F8A0QtsQAZ9F2fK8wa3M5h13j1YfLyw?e=YX7zP5)",
  },

  // --- myaudley-portal-guide: UAT link ---
  {
    slug: "myaudley-portal-guide",
    find: "The UAT site is available for reference",
    replace: "The [UAT site](https://portal-uat.audleytravel.com/) is available for reference",
  },

  // --- auth0-client-verification: video demo ---
  {
    slug: "auth0-client-verification",
    find: "**Escalate** -- If you are still stuck, escalate the client to IT Support using the appropriate case tag.",
    replace: "**Escalate** -- If you are still stuck, escalate the client to IT Support using the appropriate case tag.\n\n[Video Demo: MyAudley - Auth0 Access](https://teams.microsoft.com/l/meetingrecap?driveId=b%21AinqRdjQhUSjlRZtiptpKKf2U1rUxvxKrFWenphfS6e9S-8-J0aFTqQRLZY3i_3H&driveItemId=017ZJO6FKLCKUXUBSGIBCYHDDXUK4QBW3G&sitePath=https%3A%2F%2Faudleytravelonline-my.sharepoint.com%2F%3Av%3A%2Fg%2Fpersonal%2Fcharlotte_maile_audleytravel_com%2FIQBLEql6BkZARYOMd6K5ANtmAXoGRM_E1ai-DB3uWgSjYig&fileUrl=https%3A%2F%2Faudleytravelonline-my.sharepoint.com%2Fpersonal%2Fcharlotte_maile_audleytravel_com%2FDocuments%2FRecordings%2FMyAudley+-+Auth+0+accessrun+through-20260505_160443-Meeting+Recording.mp4%3Fweb%3D1)",
  },

  // --- getting-help-from-other-departments: helpdesk links ---
  {
    slug: "getting-help-from-other-departments",
    find: "raise a helpdesk ticket. You are responsible",
    replace: "raise a [helpdesk ticket](https://audleytravel-apps.easyvista.com/s/ssp#!?page=5e7494b3c9ee5). You are responsible",
  },
  {
    slug: "getting-help-from-other-departments",
    find: "raise a helpdesk ticket.\n",
    replace: "raise a [helpdesk ticket](https://audleytravel-apps.easyvista.com/s/ssp#!?page=5e7494b3c9ee5).\n",
  },

  // --- client-portal-support-workflow: training resources ---
  {
    slug: "client-portal-support-workflow",
    find: "Fill in Subject and Description fields",
    replace: "Fill in Subject and Description fields\n\n**Training Resources:**\n- [Client Portal Training](https://audleytravelonline.sharepoint.com/:p:/s/GlobalTravelTeamUS/IQCNnqvaEvTIS4jEtXntxsLfAdxeXbXolHp_f3Y1cKUUw-Q?e=qn2gev)\n- [Client Portal Training 2.0](https://audleytravelonline.sharepoint.com/:p:/s/GlobalTravelTeamUS/IQCQefMhVTJVRbsVn9XGfIX8AVg5enY3ZPyfzIkNlUxaXZE?e=WSFHnS)",
  },

  // --- tce-cutover: Passthrough Tracker ---
  {
    slug: "tce-cutover",
    find: "## ACTIONS BY EOW -- 5/29",
    replace: "[Passthrough Tracker](https://audleytravelonline-my.sharepoint.com/:x:/g/personal/rachael_wood_audleytravel_com/IQC-ZBfPNBxPQrsdu8vXNtQ4Af6LUsWti7g-mdo2JIQ5T20?e=dkQsNH)\n\n## ACTIONS BY EOW -- 5/29",
  },
];

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

    const results: { slug: string; find: string; status: string }[] = [];
    const now = new Date().toISOString();

    for (const r of REPLACEMENTS) {
      const docRef = getDb().collection("tce-articles").doc(r.slug);
      const doc = await docRef.get();

      if (!doc.exists) {
        results.push({ slug: r.slug, find: r.find.slice(0, 40), status: "not found" });
        continue;
      }

      const data = doc.data()!;
      const content = (data.content as string) || "";

      if (!content.includes(r.find)) {
        // Check if already replaced (link already present)
        if (content.includes(r.replace) || content.includes("](http")) {
          results.push({ slug: r.slug, find: r.find.slice(0, 40), status: "already linked" });
        } else {
          results.push({ slug: r.slug, find: r.find.slice(0, 40), status: "text not found" });
        }
        continue;
      }

      const newContent = content.replace(r.find, r.replace);
      await docRef.update({ content: newContent, updated_at: now });
      results.push({ slug: r.slug, find: r.find.slice(0, 40), status: "updated" });
    }

    invalidateCache("tce-articles");

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("migrate-tce-links error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

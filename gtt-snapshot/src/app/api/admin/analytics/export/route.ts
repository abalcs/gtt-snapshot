import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/user-queries";
import { getDashboardDataV2 } from "@/lib/analytics-queries";

async function verifyAdmin(): Promise<boolean> {
  if (process.env.BYPASS_AUTH === "true") return true;
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session) return false;
  const user = await validateSession(session.value);
  return !!user && user.role === "admin";
}

function escapeCsv(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(h => escapeCsv(h)).join(",")];
  for (const row of rows) {
    lines.push(row.map(v => escapeCsv(v)).join(","));
  }
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "overview";
  const range = Math.min(Math.max(parseInt(searchParams.get("range") ?? "30", 10), 1), 365);

  const data = await getDashboardDataV2(range);
  let csv = "";
  let filename = `analytics-${tab}-${range}d.csv`;

  switch (tab) {
    case "overview":
      csv = toCsv(
        ["Date", "Page Views"],
        data.overview.daily_views.map(d => [d.date, d.views]),
      );
      break;

    case "users":
      csv = toCsv(
        ["Name", "Email", "Last Active", "Page Views", "Active Days", "Tier", "Score", "Top Destination"],
        data.engagement.map(u => [
          u.name, u.email, u.last_active, u.page_views_30d,
          u.active_days_count, u.tier, u.engagement_score, u.top_destination,
        ]),
      );
      break;

    case "pages":
      csv = toCsv(
        ["Destination", "Views"],
        data.pages.map(p => [p.slug, p.views]),
      );
      break;

    case "searches":
      csv = toCsv(
        ["Search Query", "Count", "Zero Results"],
        data.searches.map(s => [s.query, s.count, s.zero_results ? "Yes" : "No"]),
      );
      break;

    case "features":
      csv = toCsv(
        ["Feature", "Count"],
        data.features.map(f => [f.name, f.count]),
      );
      break;

    default:
      return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

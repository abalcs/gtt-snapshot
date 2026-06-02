import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { invalidateCache } from "@/lib/data-cache";

interface LinkUpdate {
  slug: string;
  field: "general_notes_1" | "general_notes_2" | "accommodations" | "talking_points";
  mode: "append" | "set";
  text: string;
}

// Clean Outlook SafeLinks wrappers to get the actual URL
function cleanUrl(url: string): string {
  if (url.includes("nam10.safelinks.protection.outlook.com")) {
    const match = url.match(/[?&]url=([^&]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return url;
}

const LINK_UPDATES: LinkUpdate[] = [
  // --- Australia: Product for Sales ---
  {
    slug: "australia",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Product for Sales - Australia](https://audleytravelonline.sharepoint.com/sites/productcommercial/SitePages/Home_41c2a19c.aspx?RootFolder=%2Fsites%2Fproductcommercial%2FProduct%20%20Commercial%20Documents%2F2%2E%20APAC%2FANZ%2FAustralia&FolderCTID=0x01200059F7E7A9E11CF54EA7B4CF1CFBE85C54&View=%7B7F6B7E7D%2DC360%2D4197%2DAF99%2DFB9386048E4B%7D)",
  },

  // --- Kenya: Safari Collection availability calendar ---
  {
    slug: "kenya",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Safari Collection Availability Calendar](https://thesafaricollection.resrequest.com/page/public/availabilitycalendar)",
  },

  // --- China: Product for Sales ---
  {
    slug: "china",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Product for Sales - China](https://audleytravelonline.sharepoint.com/sites/productcommercial/SitePages/Home_41c2a19c.aspx?RootFolder=%2Fsites%2Fproductcommercial%2FProduct%20%20Commercial%20Documents%2F2%2E%20APAC%2FNCA%2FChina&FolderCTID=0x01200059F7E7A9E11CF54EA7B4CF1CFBE85C54&View=%7B7F6B7E7D%2DC360%2D4197%2DAF99%2DFB9386048E4B%7D)",
  },

  // --- India: Product for Sales ---
  {
    slug: "india",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Product for Sales - India](https://audleytravelonline.sharepoint.com/sites/productcommercial/SitePages/Home_41c2a19c.aspx?RootFolder=%2Fsites%2Fproductcommercial%2FProduct%20%20Commercial%20Documents%2F2%2E%20APAC%2FSCA%2FIndia&FolderCTID=0x01200059F7E7A9E11CF54EA7B4CF1CFBE85C54&View=%7B7F6B7E7D%2DC360%2D4197%2DAF99%2DFB9386048E4B%7D)",
  },

  // --- Japan: Product for Sales + Silversea cruise ---
  {
    slug: "japan",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Product for Sales - Japan](https://audleytravelonline.sharepoint.com/sites/productcommercial/SitePages/Home_41c2a19c.aspx?RootFolder=%2Fsites%2Fproductcommercial%2FProduct%20%20Commercial%20Documents%2F2%2E%20APAC%2FNCA%2FJapan&FolderCTID=0x01200059F7E7A9E11CF54EA7B4CF1CFBE85C54&View=%7B7F6B7E7D%2DC360%2D4197%2DAF99%2DFB9386048E4B%7D)\n[Silversea Tokyo Cruise](https://www.silversea.com/destinations/asia-cruise/tokyo-to-tokyo-sn241001014.html?fare=PortToPort)",
  },

  // --- Malaysian Borneo: Audley destination links ---
  {
    slug: "malaysian-borneo",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n**Useful Links:**\n[Kuching](https://www.audleytravel.com/borneo/places-to-go/kuching) · [Bako National Park](https://www.audleytravel.com/us/borneo/places-to-go/bako-national-park) · [Royal Mulu Resort](https://www.audleytravel.com/us/borneo/accommodation/royal-mulu-resort) · [Sepilok Orangutan Center](https://www.audleytravel.com/us/borneo/places-to-go/sandakan/sepilok) · [Sukau Rainforest Lodge](http://www.sukau.com/) · [Borneo Rainforest Lodge](http://www.borneonaturetours.com/www/brl_default.aspx) · [Gaya Island](https://www.audleytravel.com/borneo/places-to-go/gaya-island) · [Gaya Island Resort](https://www.audleytravel.com/us/borneo/accommodation/gaya-island-resort)",
  },

  // --- Thailand: Product for Sales ---
  {
    slug: "thailand",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Product for Sales - Thailand](https://audleytravelonline.sharepoint.com/sites/productcommercial/SitePages/Home_41c2a19c.aspx?RootFolder=%2Fsites%2Fproductcommercial%2FProduct%20%20Commercial%20Documents%2F2%2E%20APAC%2FSEA%2FThailand&FolderCTID=0x01200059F7E7A9E11CF54EA7B4CF1CFBE85C54&View=%7B7F6B7E7D%2DC360%2D4197%2DAF99%2DFB9386048E4B%7D)",
  },

  // --- Mexico: US State Dept travel map ---
  {
    slug: "mexico",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[US State Dept Travel Advisory Map](https://travelmaps.state.gov/TSGMap/?extent=-124.207939566,14.44327709,-84.313397286,33.446969624)",
  },

  // --- Italy: Rome Jubilee Updates ---
  {
    slug: "italy",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Rome Jubilee 2025 Updates](https://audleytravelonline.sharepoint.com/sites/productcommercial/Product%20%20Commercial%20Documents/Forms/AllItems.aspx?e=2%3AR69v3B&at=9&id=%2Fsites%2Fproductcommercial%2FProduct%20%20Commercial%20Documents%2F3%2E%20EMEA%2F2%2E%20Europe%2FItaly%2F6%2E%20Training%2FCheat%20Sheets%2FJubilee%202025)",
  },

  // --- Ireland: Product for Sales ---
  {
    slug: "ireland",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Product for Sales - Ireland](https://audleytravelonline.sharepoint.com/sites/productcommercial/SitePages/Home_41c2a19c.aspx?RootFolder=%2Fsites%2Fproductcommercial%2FProduct%20%20Commercial%20Documents%2F3%2E%20EMEA%2F2%2E%20Europe%2FUKIE%2FIreland%2F6%2E%20Training&FolderCTID=0x01200059F7E7A9E11CF54EA7B4CF1CFBE85C54&View=%7B7F6B7E7D%2DC360%2D4197%2DAF99%2DFB9386048E4B%7D)",
  },

  // --- United Kingdom: Product for Sales ---
  {
    slug: "united-kingdom",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Product for Sales - UK](https://audleytravelonline.sharepoint.com/sites/productcommercial/SitePages/Home_41c2a19c.aspx?RootFolder=%2Fsites%2Fproductcommercial%2FProduct%20%20Commercial%20Documents%2F3%2E%20EMEA%2F2%2E%20Europe%2FUKIE%2FUK&FolderCTID=0x01200059F7E7A9E11CF54EA7B4CF1CFBE85C54&View=%7B7F6B7E7D%2DC360%2D4197%2DAF99%2DFB9386048E4B%7D)",
  },

  // --- Canada: Trains link ---
  {
    slug: "canada",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Canada Trains Guide](https://spark.adobe.com/page/mWJFF5rtcpD4O/)",
  },

  // --- European River Cruise: AMA Waterways ---
  {
    slug: "european-river-cruise",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n**AMA Waterways Itineraries:**\n[Magna on the Danube](https://www.amawaterways.com/destination/Europe-river-cruises/2023/Magna-on-the-Danube) · [Romantic Danube](https://www.amawaterways.com/destination/europe-river-cruises/2023/romantic-danube) · [Captivating Rhine](https://www.amawaterways.com/destination/europe-river-cruises/2023/captivating-rhine)",
  },

  // --- Cruises: Cruise Product Info + Call Structure ---
  {
    slug: "cruises",
    field: "general_notes_2",
    mode: "append",
    text: "\n\n[Cruise Product Information (SharePoint)](https://audleytravelonline.sharepoint.com/sites/CruiseProductInformationUSO/)\n[Cruise Call Structure Sheet](https://audleytravelonline-my.sharepoint.com/:w:/r/personal/bridget_marshall_audleytravel_com/Documents/Cruise%20Call%20Structure%20Sheet.docx?d=w8ee542856b87400da30d8469b47220f2&csf=1&web=1&e=k4Lgaw)",
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

    const results: { slug: string; status: string }[] = [];
    const now = new Date().toISOString();

    for (const update of LINK_UPDATES) {
      const docRef = getDb().collection("destinations").doc(update.slug);
      const doc = await docRef.get();

      if (!doc.exists) {
        results.push({ slug: update.slug, status: "not found — skipped" });
        continue;
      }

      const data = doc.data()!;
      let newValue: string;

      if (update.mode === "append") {
        const existing = (data[update.field] as string) || "";
        // Check if link is already embedded (avoid duplicates)
        if (existing.includes("[Product for Sales") && update.text.includes("[Product for Sales")) {
          results.push({ slug: update.slug, status: "already has Product for Sales link — skipped" });
          continue;
        }
        if (update.text.includes("](") && existing.includes(update.text.trim().split("](")[0].slice(1))) {
          results.push({ slug: update.slug, status: "link already present — skipped" });
          continue;
        }
        newValue = existing + update.text;
      } else {
        newValue = update.text;
      }

      await docRef.update({
        [update.field]: newValue,
        updated_at: now,
      });

      results.push({ slug: update.slug, status: "updated" });
    }

    invalidateCache("destinations");

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("migrate-links error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

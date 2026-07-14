import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { batchUpsertTravelData, getAllTravelData } from "@/lib/travel-data-queries";
import { fipsToIsoCode } from "@/lib/fips-codes";
import * as cheerio from "cheerio";

async function requireAuth(request: NextRequest): Promise<boolean> {
  // Dev bypass
  if (process.env.BYPASS_AUTH === "true") return true;

  // Check CRON_SECRET header for scheduled calls
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("x-cron-secret");
  if (cronSecret && authHeader === cronSecret) return true;

  // Check admin session cookie
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) return false;
  const user = await validateSession(sessionCookie.value);
  return !!(user && user.role === "admin");
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function syncAdvisories(): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  // Fetch travel advisories
  let advisories: Record<string, { level: number; summary: string; link: string; updated: string }> = {};
  try {
    const res = await fetch("https://cadataapi.state.gov/api/TravelAdvisories");
    if (!res.ok) throw new Error(`Advisory API returned ${res.status}`);
    const data = await res.json();

    for (const item of data) {
      const title = item.Title || "";
      const levelMatch = title.match(/Level\s+(\d)/i);
      const level = levelMatch ? parseInt(levelMatch[1]) : null;
      // Category is an array of FIPS codes, e.g. ["HA"]
      const categories: string[] = item.Category || [];
      const fipsCode = categories[0] || "";
      const isoCode = fipsToIsoCode(fipsCode);
      if (!isoCode || level === null) continue;

      // Strip HTML from summary
      const rawSummary = item.Summary || title;
      const cleanSummary = stripHtml(rawSummary);

      advisories[isoCode] = {
        level,
        summary: cleanSummary,
        link: item.Link || "",
        updated: item.Published || item.Updated || "",
      };
    }
  } catch (err) {
    errors.push(`Advisory fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Country names from the travel info endpoint
  const countryNames: Record<string, string> = {};

  // Fetch entry/exit info
  let entryExitMap: Record<string, string> = {};
  try {
    const res = await fetch("https://cadataapi.state.gov/api/CountryTravelInformation");
    if (!res.ok) throw new Error(`Country info API returned ${res.status}`);
    const data = await res.json();

    for (const item of data) {
      const fipsCode = item.tag || "";
      const isoCode = fipsToIsoCode(fipsCode);
      if (!isoCode) continue;

      const rawHtml = item.entry_exit_requirements || "";
      if (rawHtml) {
        entryExitMap[isoCode] = stripHtml(rawHtml);
      }

      // Also capture country name from this endpoint
      if (item.geopoliticalarea && !countryNames[isoCode]) {
        countryNames[isoCode] = item.geopoliticalarea;
      }
    }
  } catch (err) {
    errors.push(`Entry/exit fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Merge and batch upsert
  const allCodes = new Set([...Object.keys(advisories), ...Object.keys(entryExitMap)]);
  const entries: { code: string; data: Record<string, unknown> }[] = [];
  const now = new Date().toISOString();

  for (const code of allCodes) {
    const adv = advisories[code];
    const entryExit = entryExitMap[code];

    const entry: Record<string, unknown> = {
      country_code: code,
      advisory_synced_at: now,
    };

    if (adv) {
      entry.advisory_level = adv.level;
      entry.advisory_summary = adv.summary;
      entry.advisory_link = adv.link;
      entry.advisory_updated = adv.updated;
    }

    // Use country name from travel info endpoint
    if (countryNames[code]) {
      entry.country_name = countryNames[code];
    }

    if (entryExit) {
      entry.entry_exit_info = entryExit;
    }

    entries.push({ code, data: entry });
    count++;
  }

  if (entries.length > 0) {
    await batchUpsertTravelData(entries);
  }

  return { count, errors };
}

async function syncVisa(): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-tidy.csv"
    );
    if (!res.ok) throw new Error(`Passport index returned ${res.status}`);
    const csvText = await res.text();

    // Parse CSV: columns are Passport,Destination,Requirement
    const lines = csvText.split("\n").filter(l => l.trim());
    const header = lines[0];
    const headerCols = header.split(",");
    const passportIdx = headerCols.indexOf("Passport");
    const destIdx = headerCols.indexOf("Destination");
    const reqIdx = headerCols.indexOf("Requirement");

    if (passportIdx === -1 || destIdx === -1 || reqIdx === -1) {
      throw new Error("Unexpected CSV format");
    }

    const entries: { code: string; data: Record<string, unknown> }[] = [];
    const now = new Date().toISOString();

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length < 3) continue;

      const passport = cols[passportIdx].trim();
      const destination = cols[destIdx].trim();
      const requirement = cols[reqIdx].trim();

      // Only care about US passport entries
      if (passport !== "US") continue;

      // Parse the requirement value
      let visaStatus: string | null = null;
      let visaMaxDays: number | null = null;

      const numericMatch = requirement.match(/^(\d+)$/);
      if (numericMatch) {
        // Numeric value = visa-free days
        visaStatus = "visa free";
        visaMaxDays = parseInt(numericMatch[1]);
      } else if (requirement === "-1") {
        // -1 = no admission or own country
        visaStatus = "no admission";
      } else {
        // Text values like "visa required", "e-visa", "visa on arrival", "eta"
        const lower = requirement.toLowerCase();
        if (lower.includes("visa required")) {
          visaStatus = "visa required";
        } else if (lower.includes("e-visa") || lower === "e-visa") {
          visaStatus = "e-visa";
        } else if (lower.includes("visa on arrival")) {
          visaStatus = "visa on arrival";
        } else if (lower.includes("eta")) {
          visaStatus = "eta";
        } else if (lower.includes("visa free")) {
          visaStatus = "visa free";
        } else {
          visaStatus = requirement.toLowerCase();
        }
      }

      entries.push({
        code: destination,
        data: {
          country_code: destination,
          visa_status: visaStatus,
          visa_max_days: visaMaxDays,
          visa_synced_at: now,
        },
      });
      count++;
    }

    if (entries.length > 0) {
      await batchUpsertTravelData(entries);
    }
  } catch (err) {
    errors.push(`Visa fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { count, errors };
}

// ISO-2 code → CDC travel destination URL slug
const cdcSlugs: Record<string, string> = {
  AE: "united-arab-emirates", AR: "argentina", AT: "austria", AU: "australia",
  BE: "belgium", BO: "bolivia", BR: "brazil", BT: "bhutan", BW: "botswana",
  BZ: "belize", CA: "canada", CH: "switzerland", CK: "cook-islands", CL: "chile",
  CN: "china", CO: "colombia", CR: "costa-rica", CU: "cuba", CZ: "czech-republic",
  DE: "germany", DK: "denmark", EC: "ecuador", EG: "egypt", ES: "spain",
  FJ: "fiji", FR: "france", GR: "greece", GT: "guatemala", HN: "honduras",
  HR: "croatia", HU: "hungary", ID: "indonesia", IE: "ireland", IL: "israel",
  IN: "india", IS: "iceland", IT: "italy", JO: "jordan", JP: "japan",
  KE: "kenya", KG: "kyrgyzstan", KH: "cambodia", KR: "south-korea",
  LA: "laos", LK: "sri-lanka", LU: "luxembourg", MA: "morocco", MG: "madagascar",
  MM: "burma", MU: "mauritius", MV: "maldives", MW: "malawi", MX: "mexico",
  MY: "malaysia", NA: "namibia", NL: "netherlands", NO: "norway", NP: "nepal",
  NZ: "new-zealand", OM: "oman", PA: "panama", PE: "peru", PF: "french-polynesia",
  PH: "philippines", PT: "portugal", PY: "paraguay", RW: "rwanda", SC: "seychelles",
  SE: "sweden", SG: "singapore", TH: "thailand", TR: "turkey", TZ: "tanzania",
  UG: "uganda", UY: "uruguay", UZ: "uzbekistan", VN: "vietnam", ZA: "south-africa",
  ZM: "zambia", ZW: "zimbabwe",
};

async function syncHealth(): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  // Get all existing travel data codes to know which countries to fetch
  const existing = await getAllTravelData();
  const codes = existing.map(td => td.country_code).filter(Boolean);

  if (codes.length === 0) {
    return { count: 0, errors: ["No country codes in travel_data — run advisories or visa sync first"] };
  }

  const entries: { code: string; data: Record<string, unknown> }[] = [];
  const now = new Date().toISOString();

  for (const code of codes) {
    const slug = cdcSlugs[code];
    if (!slug) {
      errors.push(`CDC ${code}: no CDC slug mapping — skipped`);
      continue;
    }

    try {
      // Rate limit: 1 request/second to be polite to CDC
      await new Promise(resolve => setTimeout(resolve, 1000));

      const url = `https://wwwnc.cdc.gov/travel/destinations/traveler/none/${slug}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "GTT-TravelSnapshot/1.0 (health-data-sync)" },
      });

      if (!res.ok) {
        if (res.status === 404) {
          errors.push(`CDC ${code} (${slug}): page not found`);
          continue;
        }
        errors.push(`CDC ${code}: HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      const vaccinesRequired: string[] = [];
      const vaccinesRecommended: string[] = [];
      let malariaInfo: string | null = null;
      const healthNotes: string[] = [];

      // Parse vaccine/disease table rows
      // CDC uses td.clinician-disease and td.clinician-recomendations (their typo)
      const diseasesCells = $("td.clinician-disease");
      const recCells = $("td.clinician-recomendations");

      diseasesCells.each((i, el) => {
        const disease = $(el).text().trim();
        const recCell = recCells.eq(i);
        const recText = recCell.text().trim();
        const recLower = recText.toLowerCase();
        const diseaseLower = disease.toLowerCase();

        // Skip routine, COVID, and purely informational rows
        if (diseaseLower.includes("routine") || diseaseLower === "covid-19") return;
        if (recLower.includes("not recommended") || !recText) return;

        // Handle malaria separately
        if (diseaseLower.includes("malaria")) {
          // Extract structured malaria info from bold sub-headers in the rec cell
          const parts: string[] = [];
          const recHtml = recCell.html() || "";
          const $rec = cheerio.load(recHtml);
          const boldHeaders = $rec("b, strong");
          if (boldHeaders.length > 0) {
            boldHeaders.each((_, bEl) => {
              const header = $rec(bEl).text().trim().replace(/:$/, "");
              // Get text after this bold element until the next bold
              let content = "";
              let sibling = $rec(bEl).get(0)?.nextSibling;
              while (sibling) {
                if (sibling.type === "tag" && (sibling.name === "b" || sibling.name === "strong")) break;
                const text = sibling.type === "text" ? sibling.data || "" : $rec(sibling).text();
                content += text;
                sibling = sibling.nextSibling;
              }
              content = content.replace(/^\s*:\s*/, "").trim();
              if (header && content) {
                parts.push(`${header}: ${content}`);
              }
            });
          }
          malariaInfo = parts.length > 0 ? parts.join(". ") : stripHtml(recText);
          return;
        }

        // Classify vaccine
        if (recLower.includes("required")) {
          vaccinesRequired.push(disease);
        } else if (recLower.includes("recommended")) {
          vaccinesRecommended.push(disease);
        }
      });

      // Check for any general health notices on the page
      const notices = $(".traveler-disease-notice, .alert-warning");
      notices.each((_, el) => {
        const text = $(el).text().trim();
        if (text) healthNotes.push(text);
      });

      entries.push({
        code,
        data: {
          health_vaccines_recommended: vaccinesRecommended,
          health_vaccines_required: vaccinesRequired,
          health_malaria_info: malariaInfo,
          health_notes: healthNotes.length > 0 ? healthNotes.join("\n") : null,
          health_synced_at: now,
        },
      });
      count++;
    } catch (err) {
      errors.push(`CDC ${code}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (entries.length > 0) {
    await batchUpsertTravelData(entries);
  }

  return { count, errors };
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await requireAuth(request);
    if (!authorized) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const syncType = searchParams.get("type") || "all";

    const results: Record<string, { count: number; errors: string[] }> = {};

    if (syncType === "advisories" || syncType === "all") {
      results.advisories = await syncAdvisories();
    }

    if (syncType === "visa" || syncType === "all") {
      results.visa = await syncVisa();
    }

    if (syncType === "health" || syncType === "all") {
      results.health = await syncHealth();
    }

    if (!results.advisories && !results.visa && !results.health) {
      return NextResponse.json(
        { error: `Unknown sync type: ${syncType}. Use advisories, visa, health, or all.` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("sync-travel-data error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

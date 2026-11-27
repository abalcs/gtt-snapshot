import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";

const DOC_PATH = "settings/site";

async function requireAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) return null;
  const user = await validateSession(sessionCookie.value);
  return user && user.role === "admin" ? user : null;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const doc = await getDb().doc(DOC_PATH).get();
  return NextResponse.json({ ...DEFAULT_SITE_SETTINGS, ...(doc.data() ?? {}) });
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const clean = (v: unknown, max: number) =>
      typeof v === "string" ? v.trim().slice(0, max) : "";
    const settings = {
      hero_title: clean(body.hero_title, 80) || DEFAULT_SITE_SETTINGS.hero_title,
      hero_subtitle: clean(body.hero_subtitle, 200) || DEFAULT_SITE_SETTINGS.hero_subtitle,
      announcement_enabled: body.announcement_enabled === true,
      announcement_text: clean(body.announcement_text, 200),
      announcement_href: clean(body.announcement_href, 300),
    };
    if (settings.announcement_enabled && !settings.announcement_text) {
      return NextResponse.json(
        { error: "Add announcement text, or switch the announcement off." },
        { status: 400 }
      );
    }
    await getDb().doc(DOC_PATH).set(settings, { merge: true });
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error("site-settings PUT error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

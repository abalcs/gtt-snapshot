import { getDb } from "@/../db/database";

/**
 * Site-wide settings an admin can change from inside the app
 * (Admin > Site Settings) — no code or redeploy needed.
 * Stored as a single Firestore doc: settings/site.
 */
export interface SiteSettings {
  hero_title: string;
  hero_subtitle: string;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_href: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  hero_title: "GTT Country Snapshot",
  hero_subtitle:
    "The Audley Travel destination reference guide. Start with a search, or browse by region below.",
  announcement_enabled: false,
  announcement_text: "",
  announcement_href: "",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const doc = await getDb().doc("settings/site").get();
    if (!doc.exists) return DEFAULT_SITE_SETTINGS;
    const data = doc.data() ?? {};
    return {
      hero_title: typeof data.hero_title === "string" && data.hero_title.trim() ? data.hero_title : DEFAULT_SITE_SETTINGS.hero_title,
      hero_subtitle: typeof data.hero_subtitle === "string" && data.hero_subtitle.trim() ? data.hero_subtitle : DEFAULT_SITE_SETTINGS.hero_subtitle,
      announcement_enabled: data.announcement_enabled === true,
      announcement_text: typeof data.announcement_text === "string" ? data.announcement_text : "",
      announcement_href: typeof data.announcement_href === "string" ? data.announcement_href : "",
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

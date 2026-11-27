import { getSiteSettings } from "@/lib/site-settings";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminSiteSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();
  return <SiteSettingsForm initial={settings} />;
}

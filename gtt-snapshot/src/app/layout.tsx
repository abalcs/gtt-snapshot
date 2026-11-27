import type { Metadata } from "next";
import { Fraunces, Open_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { AdminShell } from "@/components/layout/admin-shell";
import { getSidebarData } from "@/lib/queries";
import { getSiteSettings } from "@/lib/site-settings";
import { getPublishedPages } from "@/lib/pages";
import { getContinentForDestination, getContinentOrder } from "@/lib/continents";
import { getCurrentUser } from "@/lib/admin-auth";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GTT Country Snapshot",
  description: "Audley Travel destination reference guide",
};

async function fetchSidebarData() {
  try {
    const data = await getSidebarData();
    const continentOrder = getContinentOrder();

    const continentMap = new Map<string, { name: string; slug: string; regionSlug: string; regionName: string; status: string }[]>();

    for (const region of data.regions) {
      for (const dest of region.destinations) {
        const continent = getContinentForDestination(dest.slug, region.slug);
        if (!continentMap.has(continent)) {
          continentMap.set(continent, []);
        }
        continentMap.get(continent)!.push({
          name: dest.name,
          slug: dest.slug,
          regionSlug: region.slug,
          regionName: region.name,
          status: dest.status,
        });
      }
    }

    const continents = Array.from(continentMap.entries())
      .sort(([a], [b]) => {
        const ai = continentOrder.indexOf(a);
        const bi = continentOrder.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
      })
      .map(([name, destinations]) => ({
        name,
        destinations: destinations.sort((a, b) => a.name.localeCompare(b.name)),
      }));

    const pages = await getPublishedPages()
      .then((ps) => ps.map((p) => ({ title: p.title, slug: p.slug, section: p.section })))
      .catch(() => [] as { title: string; slug: string; section: string }[]);
    return { continents, specialSections: data.specialSections, pages };
  } catch {
    return { continents: [], specialSections: [], pages: [] };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  // Not authenticated or must change password — render bare layout for login/set-password pages
  if (!user || user.must_change_password) {
    return (
      <html lang="en">
        <body className={`${fraunces.variable} ${openSans.variable} antialiased`}>
          {children}
        </body>
      </html>
    );
  }

  const sidebarData = await fetchSidebarData();
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${openSans.variable} antialiased`}
      >
        <div className="flex h-screen overflow-hidden bg-noise">
          <Sidebar initialData={sidebarData} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header user={{ name: user.name, role: user.role }} />
            {siteSettings.announcement_enabled && siteSettings.announcement_text && (
              <div className="border-b border-[#c9a227]/50 bg-[#c9a227]/15 px-4 py-2 text-center text-[13px] text-[#22332c]">
                {siteSettings.announcement_href ? (
                  <a href={siteSettings.announcement_href} className="font-medium underline decoration-[#c9a227] underline-offset-2 hover:text-[#0e4d5c]">
                    {siteSettings.announcement_text}
                  </a>
                ) : (
                  siteSettings.announcement_text
                )}
              </div>
            )}
            <AdminShell>
              <PageTransition>
                {children}
              </PageTransition>
            </AdminShell>
          </div>
        </div>
        <FeedbackButton user={{ name: user.name, email: user.email }} />
        {user.role !== "admin" && <AnalyticsTracker userEmail={user.email} userName={user.name} />}
      </body>
    </html>
  );
}

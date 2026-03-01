import type { Metadata } from "next";
import { Merriweather, Open_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { AdminShell } from "@/components/layout/admin-shell";
import { getSidebarData } from "@/lib/queries";
import { getContinentForDestination, getContinentOrder } from "@/lib/continents";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
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

    const continentMap = new Map<string, { name: string; slug: string; regionSlug: string; regionName: string }[]>();

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

    return { continents, specialSections: data.specialSections };
  } catch {
    return { continents: [], specialSections: [] };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarData = await fetchSidebarData();

  return (
    <html lang="en">
      <body
        className={`${merriweather.variable} ${openSans.variable} antialiased`}
      >
        <div className="flex h-screen overflow-hidden">
          <Sidebar initialData={sidebarData} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <AdminShell>
              <PageTransition>
                {children}
              </PageTransition>
            </AdminShell>
          </div>
        </div>
      </body>
    </html>
  );
}

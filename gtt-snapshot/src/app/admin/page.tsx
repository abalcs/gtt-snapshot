import Link from "next/link";
import type { ComponentType } from "react";
import {
  Tags,
  Newspaper,
  Mail,
  Files,
  SlidersHorizontal,
  Users,
  UserRoundCheck,
  Plane,
  OctagonX,
  MessageSquare,
  ChartColumn,
  History,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllDestinations, getAllDestinationsAdmin, getAllRegions, getAllSpecialSections, getAdminLogs, getPricingVisible } from "@/lib/queries";
import { AdminList } from "@/components/admin/admin-list";
import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/../db/database";
import { PricingToggle } from "@/components/admin/pricing-toggle";

export const dynamic = 'force-dynamic';

interface NavItem {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  badgeTitle?: string;
}

function NavCard({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="group relative block">
      <div className="flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[#c9a227]/60 group-hover:shadow-[var(--shadow-md)]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0e4d5c]/10 text-[#0e4d5c] transition-colors group-hover:bg-[#0e4d5c] group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{item.title}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                title={item.badgeTitle}
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white"
              >
                {item.badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-[#c9a227]" />
      </div>
    </Link>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const [destinations, regions, specialSections, feedbackSnap, todayLogs, pricingVisible] = await Promise.all([
    getAllDestinationsAdmin(),
    getAllRegions(),
    getAllSpecialSections(),
    getDb().collection("feedback").where("status", "==", "new").get(),
    getAdminLogs(200),
    getPricingVisible(),
  ]);
  const newFeedbackCount = feedbackSnap.size;

  // Count expired stop sells
  const today = new Date().toISOString().split("T")[0];
  let expiredStopSellCount = 0;
  let activeStopSellCount = 0;
  for (const dest of destinations) {
    if (dest.status === "stop_sell") activeStopSellCount++;
    if (dest.stop_sell_expires && dest.stop_sell_expires < today) {
      expiredStopSellCount++;
    }
  }

  // Count changes today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const changesToday = todayLogs.filter(l => new Date(l.timestamp) >= todayStart).length;

  // Active destinations count
  const activeCount = destinations.filter(d => d.status === "active").length;

  // Sort destinations alphabetically by name
  const sorted = [...destinations].sort((a, b) => a.name.localeCompare(b.name));

  // Recently updated (sort by updated_at descending, take 10)
  const recent = [...destinations]
    .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
    .slice(0, 10);

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: "Content",
      items: [
        { href: "/admin/pages", title: "Page Manager", description: "Add, edit and organise the guide pages in the sidebar", icon: Files },
        { href: "/admin/tags", title: "Tags", description: "The labels behind Help Me Choose filtering", icon: Tags },
        { href: "/admin/tce-articles", title: "TCE Resources", description: "Articles and resources for the TCE team", icon: Newspaper },
        { href: "/admin/email-templates", title: "Email Templates", description: "Standard templates advisors send to clients", icon: Mail },
        { href: "/admin/site-settings", title: "Site Settings", description: "Home page wording and the announcement banner", icon: SlidersHorizontal },
      ],
    },
    {
      label: "People",
      items: [
        { href: "/admin/users", title: "Users", description: "Accounts, roles and who can sign in", icon: Users },
        { href: "/admin/consultants", title: "Consultants", description: "Country specialist consultant listings", icon: UserRoundCheck },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/travel-data", title: "Travel Data", description: "Sync and manage the underlying travel data", icon: Plane },
        { href: "/admin/stop-sells", title: "Stop Sells", description: "Destinations currently not selling, and expiries to review", icon: OctagonX, badge: expiredStopSellCount, badgeTitle: "Expired stop sells" },
        { href: "/admin/feedback", title: "Feedback", description: "Suggestions and reports from advisors", icon: MessageSquare, badge: newFeedbackCount, badgeTitle: "New feedback" },
        { href: "/admin/analytics", title: "Analytics", description: "How the site is being used", icon: ChartColumn },
        { href: "/admin/log", title: "Activity Log", description: "Who changed what, and when", icon: History },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d4256] via-[#0e4d5c] to-[#07222b] px-8 py-7 shadow-[var(--shadow-md)]">
        <div className="absolute inset-0 bg-dots opacity-10" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a227]">Administration</p>
            <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight text-white">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-white/65">Manage destinations, content and the people who use the site.</p>
          </div>
          <Link href="/admin/destinations/new">
            <Button className="bg-[#c9a227] font-semibold text-[#07222b] shadow-[var(--shadow-md)] transition-colors hover:bg-[#d9b545]">
              <Plus className="mr-1.5 h-4 w-4" /> Add Destination
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation groups */}
      {navGroups.map((group) => (
        <section key={group.label} className="space-y-3">
          <h2 className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {group.label}
            <span className="h-px flex-1 bg-border" />
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <NavCard key={item.href} item={item} />
            ))}
          </div>
        </section>
      ))}

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="font-serif text-[28px] font-semibold leading-none">{activeCount}</div>
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active Destinations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="font-serif text-[28px] font-semibold leading-none text-red-600">{activeStopSellCount}</div>
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Stop Sells</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="font-serif text-[28px] font-semibold leading-none text-amber-600">{newFeedbackCount}</div>
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pending Feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="font-serif text-[28px] font-semibold leading-none text-[#0e4d5c]">{changesToday}</div>
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Changes Today</p>
          </CardContent>
        </Card>
        <PricingToggle initialVisible={pricingVisible} />
      </div>

      {/* Stats by region */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {regions.map((region) => (
          <Card key={region.slug} className="transition-shadow hover:shadow-[var(--shadow-md)]">
            <CardContent className="pt-4 pb-4">
              <div className="font-serif text-[28px] font-semibold leading-none">{region.destination_count}</div>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{region.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Destination + Special Sections list with search */}
      <Card>
        <CardHeader>
          <CardTitle>All Destinations ({destinations.length}) &amp; Special Sections ({specialSections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminList destinations={sorted} specialSections={specialSections} />
        </CardContent>
      </Card>

      {/* Recently updated */}
      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {recent.map((dest) => (
                <div key={dest.id} className="group flex items-center justify-between py-2">
                  <Link
                    href={`/destinations/${dest.slug}`}
                    className="text-sm font-medium hover:text-[#0e4d5c] hover:underline"
                  >
                    {dest.name}
                  </Link>
                  <span className="flex items-center gap-3">
                    <Link
                      href={`/admin/destinations/${dest.slug}/edit`}
                      className="text-xs font-medium text-[#0e4d5c] opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                    >
                      Edit
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {dest.updated_at ? new Date(dest.updated_at).toLocaleDateString() : "—"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllDestinations, getAllDestinationsAdmin, getAllRegions, getAllSpecialSections } from "@/lib/queries";
import { AdminList } from "@/components/admin/admin-list";
import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/../db/database";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireAdmin();
  const [destinations, regions, specialSections, feedbackSnap] = await Promise.all([
    getAllDestinationsAdmin(),
    getAllRegions(),
    getAllSpecialSections(),
    getDb().collection("feedback").where("status", "==", "new").get(),
  ]);
  const newFeedbackCount = feedbackSnap.size;

  // Count expired stop sells
  const today = new Date().toISOString().split("T")[0];
  let expiredStopSellCount = 0;
  for (const dest of destinations) {
    if (dest.stop_sell_expires && dest.stop_sell_expires < today) {
      expiredStopSellCount++;
    }
  }

  // Sort destinations alphabetically by name
  const sorted = [...destinations].sort((a, b) => a.name.localeCompare(b.name));

  // Recently updated (sort by updated_at descending, take 10)
  const recent = [...destinations]
    .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
    .slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 px-8 py-6 shadow-[var(--shadow-md)]">
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Admin Dashboard</h1>
              <p className="text-amber-100">Manage destinations and content</p>
            </div>
            <Link href="/admin/destinations/new">
              <Button className="bg-white text-amber-700 hover:bg-white/90 shadow-sm">Add Destination</Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border-white/30">Manage Users</Button>
            </Link>
            <Link href="/admin/tags">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border-white/30">Manage Tags</Button>
            </Link>
            <Link href="/admin/consultants">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border-white/30">Consultants</Button>
            </Link>
            <Link href="/admin/email-templates">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border-white/30">Email Templates</Button>
            </Link>
            <Link href="/admin/tce-articles">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border-white/30">TCE Resources</Button>
            </Link>
            <Link href="/admin/country-specialists">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border-white/30">Specialists</Button>
            </Link>
            <Link href="/admin/stop-sells" className="relative">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border-white/30">Stop Sells</Button>
              {expiredStopSellCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {expiredStopSellCount}
                </span>
              )}
            </Link>
            <Link href="/admin/feedback" className="relative">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border-white/30">Feedback</Button>
              {newFeedbackCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {newFeedbackCount}
                </span>
              )}
            </Link>
            <Link href="/admin/log">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border-white/30">Activity Log</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats by region */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {regions.map((region) => (
          <Card key={region.slug}>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold">{region.destination_count}</div>
              <p className="text-xs text-muted-foreground">{region.name}</p>
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
            <div className="space-y-2">
              {recent.map((dest) => (
                <div key={dest.id} className="flex items-center justify-between py-1">
                  <Link
                    href={`/destinations/${dest.slug}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {dest.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {dest.updated_at ? new Date(dest.updated_at).toLocaleDateString() : "\u2014"}
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

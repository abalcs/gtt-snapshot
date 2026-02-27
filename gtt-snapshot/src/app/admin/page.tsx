import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllDestinations, getAllRegions, getAllSpecialSections } from "@/lib/queries";
import { AdminList } from "@/components/admin/admin-list";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [destinations, regions, specialSections] = await Promise.all([
    getAllDestinations(),
    getAllRegions(),
    getAllSpecialSections(),
  ]);

  // Sort destinations alphabetically by name
  const sorted = [...destinations].sort((a, b) => a.name.localeCompare(b.name));

  // Recently updated (sort by updated_at descending, take 10)
  const recent = [...destinations]
    .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
    .slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage destinations and content</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tags">
            <Button variant="outline">Manage Tags</Button>
          </Link>
          <Link href="/admin/log">
            <Button variant="outline">Activity Log</Button>
          </Link>
          <Link href="/admin/destinations/new">
            <Button>Add Destination</Button>
          </Link>
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

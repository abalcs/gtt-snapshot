import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllDestinations, getAllRegions } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [destinations, regions] = await Promise.all([
    getAllDestinations(),
    getAllRegions(),
  ]);

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

      {/* Destination list */}
      <Card>
        <CardHeader>
          <CardTitle>All Destinations ({destinations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Region</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Updated</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {destinations.map((dest) => (
                  <tr key={dest.id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link
                        href={`/destinations/${dest.slug}`}
                        className="font-medium hover:underline"
                      >
                        {dest.name}
                      </Link>
                    </td>
                    <td className="py-2">
                      <Badge variant="secondary" className="text-xs">
                        {dest.region_name}
                      </Badge>
                    </td>
                    <td className="py-2">
                      {dest.status === "active" ? (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">Active</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">{dest.status}</Badge>
                      )}
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">
                      {dest.updated_at ? new Date(dest.updated_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2 text-right">
                      <Link href={`/admin/destinations/${dest.slug}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    {dest.updated_at ? new Date(dest.updated_at).toLocaleDateString() : "—"}
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

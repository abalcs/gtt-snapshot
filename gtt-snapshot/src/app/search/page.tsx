import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { searchDestinations, searchSpecialSections } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q || "";

  if (!query.trim()) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground mt-2">Enter a search term to find destinations.</p>
      </div>
    );
  }

  const [destinations, specialSections] = await Promise.all([
    searchDestinations(query, 50),
    searchSpecialSections(query),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Search results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-muted-foreground mt-1">
          {destinations.length} destination{destinations.length !== 1 ? "s" : ""}
          {specialSections.length > 0 &&
            `, ${specialSections.length} special section${specialSections.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {destinations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Destinations</h2>
          {destinations.map((dest) => (
            <Link key={dest.id} href={`/destinations/${dest.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{dest.name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {dest.region_name}
                      </Badge>
                    </div>
                  </div>
                  {dest.snippet && (
                    <p
                      className="text-sm text-muted-foreground mt-2"
                      dangerouslySetInnerHTML={{ __html: dest.snippet }}
                    />
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {specialSections.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Special Sections</h2>
          {specialSections.map((section) => (
            <Link key={section.slug} href={`/special/${section.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-4">
                  <h3 className="font-medium">{section.title}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {destinations.length === 0 && specialSections.length === 0 && (
        <p className="text-muted-foreground">
          No results found. Try a different search term.
        </p>
      )}
    </div>
  );
}

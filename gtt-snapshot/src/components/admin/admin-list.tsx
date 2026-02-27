"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DestinationWithRegion, SpecialSection } from "@/lib/types";

interface Props {
  destinations: DestinationWithRegion[];
  specialSections: SpecialSection[];
}

export function AdminList({ destinations, specialSections }: Props) {
  const [search, setSearch] = useState("");

  const query = search.toLowerCase().trim();

  const filteredDestinations = query
    ? destinations.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.region_name.toLowerCase().includes(query)
      )
    : destinations;

  const filteredSections = query
    ? specialSections.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query)
      )
    : specialSections;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search destinations and special sections..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

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
            {filteredDestinations.map((dest) => (
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
                    <Badge
                      variant="outline"
                      className="text-xs text-green-600 border-green-200"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      {dest.status}
                    </Badge>
                  )}
                </td>
                <td className="py-2 text-muted-foreground text-xs">
                  {dest.updated_at
                    ? new Date(dest.updated_at).toLocaleDateString()
                    : "\u2014"}
                </td>
                <td className="py-2 text-right">
                  <Link href={`/admin/destinations/${dest.slug}/edit`}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}

            {filteredSections.length > 0 && (
              <>
                <tr className="border-b bg-muted/50">
                  <td
                    colSpan={5}
                    className="py-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Special Sections ({filteredSections.length})
                  </td>
                </tr>
                {filteredSections.map((section) => (
                  <tr key={section.id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link
                        href={`/special/${section.slug}`}
                        className="font-medium hover:underline"
                      >
                        {section.title}
                      </Link>
                    </td>
                    <td className="py-2">
                      {section.region_scope ? (
                        <Badge variant="secondary" className="text-xs">
                          {section.region_scope}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          All
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <Badge
                        variant="outline"
                        className="text-xs text-blue-600 border-blue-200"
                      >
                        Special
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">
                      {"\u2014"}
                    </td>
                    <td className="py-2 text-right">
                      <Link
                        href={`/admin/special-sections/${section.slug}/edit`}
                      >
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {filteredDestinations.length === 0 &&
              filteredSections.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No results found for &ldquo;{search}&rdquo;
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

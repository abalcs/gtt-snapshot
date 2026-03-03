import { getAllDestinations, getAllTagDefinitions } from "@/lib/queries";
import { CompareClient } from "./compare-client";
import { requireAuth } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ slugs?: string }>;
}) {
  await requireAuth();
  const { slugs: slugsParam } = await searchParams;
  const initialSlugs = slugsParam ? slugsParam.split(",").filter(Boolean).slice(0, 3) : [];

  const [allDestinations, tagDefinitions] = await Promise.all([
    getAllDestinations(),
    getAllTagDefinitions(),
  ]);

  return (
    <CompareClient
      allDestinations={allDestinations}
      tagDefinitions={tagDefinitions}
      initialSlugs={initialSlugs}
    />
  );
}

import { requireAuth } from "@/lib/admin-auth";
import { SpecialistsClient } from "./specialists-client";

export const dynamic = "force-dynamic";

export default async function CountrySpecialistsPage() {
  await requireAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/" className="hover:underline">Home</a>
        <span>/</span>
        <span>Country Specialists</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Country Specialists</h1>
        <p className="text-muted-foreground">
          Search by country or specialist name to find who sells each destination.
        </p>
      </div>

      <SpecialistsClient />
    </div>
  );
}

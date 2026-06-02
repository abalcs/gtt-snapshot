import Link from "next/link";
import { requireAuth } from "@/lib/admin-auth";
import { TceResourcesClient } from "./tce-client";
import { getTceArticles } from "@/lib/tce-queries";

export const dynamic = "force-dynamic";

export default async function TceResourcesPage() {
  await requireAuth();
  const articles = await getTceArticles();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span>TCE Resources</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">TCE Resources</h1>
        <p className="text-muted-foreground">
          Travel Consultant Excellence training materials — search or browse by category.
        </p>
      </div>

      <TceResourcesClient articles={articles} />
    </div>
  );
}

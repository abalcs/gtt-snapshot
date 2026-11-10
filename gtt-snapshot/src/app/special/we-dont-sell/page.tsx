import Link from "next/link";
import { requireAuth } from "@/lib/admin-auth";
import { getDb } from "@/../db/database";
import { WeDontSellClient } from "./we-dont-sell-client";

export const dynamic = "force-dynamic";

export default async function WeDontSellPage() {
  await requireAuth();

  const doc = await getDb().collection("special_sections").doc("we-dont-sell").get();
  const data = doc.data();

  const us_content: string = data?.us_content ?? "";
  const uk_content: string = data?.uk_content ?? "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span>Special Sections</span>
        <span>/</span>
        <span>We Don&apos;t Sell</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">We Don&apos;t Sell</h1>

      <WeDontSellClient usContent={us_content} ukContent={uk_content} />
    </div>
  );
}

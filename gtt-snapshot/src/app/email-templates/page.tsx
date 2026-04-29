import Link from "next/link";
import { requireAuth } from "@/lib/admin-auth";
import { getEmailTemplatesFromDb } from "@/lib/email-templates";
import { invalidateCache } from "@/lib/data-cache";
import { EmailTemplatesClient } from "./email-templates-client";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  await requireAuth();
  invalidateCache("email-templates");
  const destinations = await getEmailTemplatesFromDb();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span>Email Templates</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
        <p className="text-muted-foreground">
          Copy-ready email templates for top destinations. Click a template to expand, then copy to clipboard.
        </p>
      </div>

      <EmailTemplatesClient destinations={destinations} />
    </div>
  );
}

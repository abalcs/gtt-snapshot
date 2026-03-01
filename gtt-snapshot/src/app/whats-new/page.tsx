import Link from "next/link";
import { getAdminLogs } from "@/lib/queries";
import { WhatsNewFeed } from "@/components/whats-new-feed";

export const dynamic = 'force-dynamic';

export default async function WhatsNewPage() {
  const logs = await getAdminLogs(50);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">What&apos;s New</h1>
          <p className="text-muted-foreground">
            Recent destination updates ({logs.length} entries)
          </p>
        </div>
        <Link href="/" className="text-sm text-primary hover:underline">
          Back to Home
        </Link>
      </div>

      <WhatsNewFeed logs={logs} />
    </div>
  );
}

import { requireAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const EMBED_URL =
  "https://audleytravelonline.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc={00f1d001-31e8-4176-9eb4-84ae03b3a747}&action=embedview&wdAllowInteractivity=True&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=True";

const SHAREPOINT_URL =
  "https://audleytravelonline.sharepoint.com/:x:/r/_layouts/15/doc2.aspx?sourcedoc=%7B00F1D001-31E8-4176-9EB4-84AE03B3A747%7D&action=default";

export default async function CountrySpecialistsPage() {
  await requireAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/" className="hover:underline">Home</a>
        <span>/</span>
        <span>Country Specialists</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Country Specialists</h1>
          <p className="text-muted-foreground">
            Country coverage by specialist. This data is maintained in SharePoint and updates automatically.
          </p>
        </div>
        <a
          href={SHAREPOINT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors whitespace-nowrap shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open in SharePoint
        </a>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <iframe
          src={EMBED_URL}
          className="w-full border-0"
          style={{ height: "80vh", minHeight: "600px" }}
          title="Country Specialists Coverage"
          allowFullScreen
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        If the spreadsheet doesn&apos;t load, you may need to sign in with your Audley Microsoft 365 account.
      </p>
    </div>
  );
}

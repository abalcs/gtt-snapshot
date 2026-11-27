import { notFound } from "next/navigation";
import Link from "next/link";
import { getSpecialSectionBySlug } from "@/lib/queries";
import { requireAuth } from "@/lib/admin-auth";
import { MarkdownContent } from "@/components/pages/markdown-content";

export const dynamic = 'force-dynamic';

export default async function SpecialSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuth();
  const { slug } = await params;
  const section = await getSpecialSectionBySlug(slug);

  if (!section) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span>Special Sections</span>
        <span>/</span>
        <span>{section.title}</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{section.title}</h1>

      {section.region_scope && (
        <p className="text-sm text-muted-foreground">
          Scope: {section.region_scope}
        </p>
      )}

      {section.pdf_url ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{section.content}</p>
          <div className="flex items-center gap-3">
            <a
              href={section.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0e4d5c] rounded-md hover:bg-[#2a4a40] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Open PDF in New Tab
            </a>
            <a
              href={section.pdf_url}
              download
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF
            </a>
          </div>
          <object
            data={section.pdf_url}
            type="application/pdf"
            className="w-full rounded-lg border"
            style={{ height: "85vh" }}
          >
            <p className="text-sm text-muted-foreground p-4">
              Your browser does not support embedded PDFs. Use the buttons above to open or download the file.
            </p>
          </object>
        </div>
      ) : section.content ? (
        <div className="prose prose-sm max-w-none">
          <MarkdownContent content={section.content} />
        </div>
      ) : null}
    </div>
  );
}

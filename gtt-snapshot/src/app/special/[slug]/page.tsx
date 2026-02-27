import { notFound } from "next/navigation";
import Link from "next/link";
import { getSpecialSectionBySlug } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export default async function SpecialSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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

      <div className="prose prose-sm max-w-none">
        <MarkdownContent content={section.content} />
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown-like rendering: handle headers, lists, bold, and paragraphs
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let key = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc pl-5 space-y-1 my-2">
          {currentList.map((item, i) => (
            <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={key++} className="text-base font-semibold mt-4 mb-2">{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={key++} className="text-lg font-semibold mt-6 mb-2">{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(<h1 key={key++} className="text-xl font-bold mt-6 mb-3">{trimmed.slice(2)}</h1>);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      currentList.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      currentList.push(trimmed.replace(/^\d+\.\s/, ""));
    } else if (trimmed.startsWith("|")) {
      flushList();
      // Table row - collect consecutive table rows
      const tableRows: string[] = [trimmed];
      // This is simplified - handled line by line
      elements.push(
        <div key={key++} className="text-sm font-mono bg-muted/50 rounded px-3 py-1 my-1 overflow-x-auto">
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
        </div>
      );
      void tableRows; // suppress unused
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-sm leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
      );
    }
  }
  flushList();

  return <div>{elements}</div>;
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

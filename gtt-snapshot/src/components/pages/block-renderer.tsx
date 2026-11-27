import Link from "next/link";
import type { PageBlock } from "@/lib/types";
import { MarkdownContent, formatInline } from "./markdown-content";

// The one shared renderer for Pages. Every page on the site renders its
// blocks through here, so a page built in the Page Manager looks the same
// everywhere it appears.

const CALLOUT_STYLES: Record<string, { box: string; badge: string; label: string }> = {
  info: {
    box: "border-[#0e4d5c]/30 bg-[#0e4d5c]/5",
    badge: "bg-[#0e4d5c] text-white",
    label: "Info",
  },
  warning: {
    box: "border-amber-500/40 bg-amber-50",
    badge: "bg-amber-500 text-white",
    label: "Worth knowing",
  },
  tip: {
    box: "border-emerald-600/30 bg-emerald-50",
    badge: "bg-emerald-600 text-white",
    label: "Tip",
  },
};

export function BlockRenderer({ blocks }: { blocks: PageBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return block.level === 3 ? (
              <h3 key={i} className="text-lg font-semibold pt-2">{block.text}</h3>
            ) : (
              <h2 key={i} className="text-xl font-semibold pt-3">{block.text}</h2>
            );

          case "richtext":
            return (
              <div key={i} className="prose prose-sm max-w-none">
                <MarkdownContent content={block.markdown} />
              </div>
            );

          case "callout": {
            const style = CALLOUT_STYLES[block.tone] ?? CALLOUT_STYLES.info;
            return (
              <div key={i} className={`rounded-lg border px-4 py-3 ${style.box}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
                    {style.label}
                  </span>
                  {block.title && <span className="text-sm font-semibold">{block.title}</span>}
                </div>
                <p
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatInline(block.text) }}
                />
              </div>
            );
          }

          case "checklist":
            return (
              <ul key={i} className="space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0e4d5c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                  </li>
                ))}
              </ul>
            );

          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0e4d5c]/5">
                      {block.headers.map((h, j) => (
                        <th key={j} className="px-3 py-2 text-left font-semibold border-b border-border">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 ? "bg-muted/40" : undefined}>
                        {block.headers.map((_, ci) => (
                          <td
                            key={ci}
                            className="px-3 py-2 align-top border-b border-border/50"
                            dangerouslySetInnerHTML={{ __html: formatInline(row[ci] ?? "") }}
                          />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "accordion":
            return (
              <div key={i} className="divide-y divide-border rounded-lg border border-border">
                {block.items.map((item, j) => (
                  <details key={j} className="group px-4 py-3">
                    <summary className="cursor-pointer text-sm font-semibold marker:text-[#0e4d5c]">
                      {item.title}
                    </summary>
                    <div className="prose prose-sm max-w-none pt-2">
                      <MarkdownContent content={item.body} />
                    </div>
                  </details>
                ))}
              </div>
            );

          case "links":
            return (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {block.items.map((item, j) => (
                  <Link
                    key={j}
                    href={item.href}
                    className="group rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-[#c9a227] hover:shadow-[var(--shadow-md)]"
                  >
                    <span className="text-sm font-semibold text-[#0e4d5c] group-hover:underline">
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="block text-xs text-muted-foreground mt-0.5">{item.description}</span>
                    )}
                  </Link>
                ))}
              </div>
            );

          case "cta":
            return (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#0d4256] to-[#07222b] px-5 py-4"
              >
                <p className="text-sm text-white/85">{block.text ?? block.label}</p>
                <Link
                  href={block.href}
                  className="shrink-0 rounded-md bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#07222b] hover:bg-[#d9b545] transition-colors"
                >
                  {block.label}
                </Link>
              </div>
            );

          case "divider":
            return <div key={i} className="gradient-separator" />;

          default:
            return null;
        }
      })}
    </div>
  );
}

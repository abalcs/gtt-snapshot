"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DestinationTemplates } from "@/lib/email-templates";

const TYPE_COLORS: Record<string, string> = {
  Standard: "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Very Soon Departure": "bg-amber-100 text-amber-800 border-amber-300",
  "Long-Range Planning": "bg-blue-100 text-blue-800 border-blue-300",
};

export function EmailTemplatesClient({ destinations }: { destinations: DestinationTemplates[] }) {
  const [expandedDest, setExpandedDest] = useState<Set<string>>(new Set());
  const [viewTab, setViewTab] = useState<Record<string, number>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleDest = (dest: string) => {
    setExpandedDest((prev) => {
      const next = new Set(prev);
      if (next.has(dest)) next.delete(dest);
      else next.add(dest);
      return next;
    });
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {destinations.map(({ destination, author, templates }) => (
        <section key={destination} className="border rounded-lg overflow-hidden shadow-[var(--shadow-sm)]">
          <button
            onClick={() => toggleDest(destination)}
            className="flex w-full items-center justify-between px-4 py-3 bg-gradient-to-r from-[#f0f5f2] to-[#e8f0ec] border-l-4 border-l-[#3a5f54] hover:from-[#e8f0ec] hover:to-[#dde9e3] transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{destination}</h2>
              <span className="text-xs text-muted-foreground">by {author}</span>
            </div>
            <span className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>{templates.length} templates</span>
              <span
                className={cn(
                  "transition-transform duration-200 inline-block text-base",
                  expandedDest.has(destination) && "rotate-90"
                )}
              >
                &#x203A;
              </span>
            </span>
          </button>
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
              expandedDest.has(destination)
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="p-4 space-y-3">
                {/* Template type tabs */}
                <div className="flex border-b">
                  {templates.map((template, idx) => (
                    <button
                      key={template.type}
                      type="button"
                      onClick={() => setViewTab((prev) => ({ ...prev, [destination]: idx }))}
                      className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        (viewTab[destination] ?? 0) === idx
                          ? "border-[#3a5f54] text-[#3a5f54]"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            TYPE_COLORS[template.type]?.split(" ")[0] || "bg-gray-300"
                          )}
                        />
                        {template.type}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Active template content */}
                {(() => {
                  const idx = viewTab[destination] ?? 0;
                  const template = templates[idx];
                  if (!template) return null;
                  const key = `${destination}-${template.type}`;
                  const isCopied = copiedKey === key;
                  const isSubjectCopied = copiedKey === `${key}-subject`;

                  return (
                    <div className="space-y-3">
                      {template.subject && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground shrink-0">Subject:</span>
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                            {template.subject}
                          </code>
                          <button
                            onClick={() => copyToClipboard(template.subject!, `${key}-subject`)}
                            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors shrink-0"
                          >
                            {isSubjectCopied ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Copied
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="relative group">
                        <pre className="whitespace-pre-wrap text-sm bg-muted/50 border rounded-md p-4 max-h-80 overflow-y-auto font-sans leading-relaxed">
                          {template.body}
                        </pre>
                        <button
                          onClick={() => copyToClipboard(template.body, key)}
                          className={cn(
                            "absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all shadow-sm",
                            isCopied
                              ? "bg-emerald-600 text-white"
                              : "bg-white border text-foreground hover:bg-accent opacity-0 group-hover:opacity-100"
                          )}
                        >
                          {isCopied ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                              Copy Body
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

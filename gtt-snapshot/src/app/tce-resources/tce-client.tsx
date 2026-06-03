"use client";

import { useState, useMemo } from "react";
import { TCE_CATEGORIES, type TceCategory, type TceArticle } from "@/lib/tce-data";

const CATEGORY_COLORS: Record<TceCategory, { bg: string; text: string; ring: string; activeBg: string; activeText: string }> = {
  'getting-started': { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', activeBg: 'bg-blue-600', activeText: 'text-white' },
  'processes': { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', activeBg: 'bg-emerald-600', activeText: 'text-white' },
  'client-portal': { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200', activeBg: 'bg-purple-600', activeText: 'text-white' },
  'help-faqs': { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', activeBg: 'bg-amber-600', activeText: 'text-white' },
};

function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
}

function MarkdownContent({ content, searchQuery }: { content: string; searchQuery: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let key = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc pl-5 space-y-1 my-2">
          {currentList.map((item, i) => (
            <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: highlightText(formatInline(item), searchQuery) }} />
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
      elements.push(
        <h3 key={key++} className="text-base font-semibold mt-4 mb-2"
          dangerouslySetInnerHTML={{ __html: highlightText(formatInline(trimmed.slice(4)), searchQuery) }} />
      );
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-lg font-semibold mt-5 mb-2"
          dangerouslySetInnerHTML={{ __html: highlightText(formatInline(trimmed.slice(3)), searchQuery) }} />
      );
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={key++} className="text-xl font-bold mt-6 mb-3"
          dangerouslySetInnerHTML={{ __html: highlightText(formatInline(trimmed.slice(2)), searchQuery) }} />
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      currentList.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      currentList.push(trimmed.replace(/^\d+\.\s/, ""));
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-sm leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: highlightText(formatInline(trimmed), searchQuery) }} />
      );
    }
  }
  flushList();

  return <div>{elements}</div>;
}

function formatInline(text: string): string {
  return text
    // Markdown links: [text](url)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-0.5 text-[#3a5f54] font-medium underline decoration-[#3a5f54]/30 underline-offset-2 hover:decoration-[#3a5f54] transition-colors">$1<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>'
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

export function TceResourcesClient({ articles }: { articles: TceArticle[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<TceCategory>>(new Set());
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: TceCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleArticle = (slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return articles.filter((article) => {
      if (activeCategories.size > 0 && !activeCategories.has(article.category)) return false;
      if (q) {
        return (
          article.title.toLowerCase().includes(q) ||
          article.content.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, activeCategories]);

  // Auto-expand articles that match search
  const expandedSet = useMemo(() => {
    if (!searchQuery.trim()) return expandedSlugs;
    const autoExpanded = new Set(expandedSlugs);
    for (const article of filtered) {
      autoExpanded.add(article.slug);
    }
    return autoExpanded;
  }, [searchQuery, filtered, expandedSlugs]);

  const getCategoryLabel = (cat: TceCategory) =>
    TCE_CATEGORIES.find((c) => c.slug === cat)?.label ?? cat;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Search TCE articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-input bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {TCE_CATEGORIES.map((cat) => {
          const isActive = activeCategories.has(cat.slug);
          const colors = CATEGORY_COLORS[cat.slug];
          return (
            <button
              key={cat.slug}
              onClick={() => toggleCategory(cat.slug)}
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors cursor-pointer ${
                isActive
                  ? `${colors.activeBg} ${colors.activeText} ring-transparent`
                  : `${colors.bg} ${colors.text} ${colors.ring} hover:opacity-80`
              }`}
            >
              {cat.label}
            </button>
          );
        })}
        {activeCategories.size > 0 && (
          <button
            onClick={() => setActiveCategories(new Set())}
            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} of {articles.length} articles
        {searchQuery.trim() && ` matching "${searchQuery.trim()}"`}
      </p>

      {/* Accordion cards */}
      <div className="space-y-3">
        {filtered.map((article) => {
          const isExpanded = expandedSet.has(article.slug);
          const colors = CATEGORY_COLORS[article.category];
          return (
            <div
              key={article.slug}
              id={article.slug}
              className="rounded-lg border bg-white shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleArticle(article.slug)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                <span
                  className="flex-1 font-medium text-sm"
                  dangerouslySetInnerHTML={{
                    __html: highlightText(article.title, searchQuery),
                  }}
                />
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${colors.bg} ${colors.text} ${colors.ring}`}
                >
                  {getCategoryLabel(article.category)}
                </span>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-4 pl-11">
                  <div className="prose prose-sm max-w-none">
                    <MarkdownContent content={article.content} searchQuery={searchQuery} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No articles match your search.
          </div>
        )}
      </div>
    </div>
  );
}

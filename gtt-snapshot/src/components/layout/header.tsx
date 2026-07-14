"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface SearchResultItem {
  id: number;
  name: string;
  slug: string;
  region_name: string;
  snippet: string;
}

interface SpecialSectionResult {
  title: string;
  slug: string;
}

interface TceArticleResult {
  title: string;
  slug: string;
  category: string;
}

interface HeaderProps {
  user?: { name: string; role: string };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [specialResults, setSpecialResults] = useState<SpecialSectionResult[]>([]);
  const [tceResults, setTceResults] = useState<TceArticleResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSpecialResults([]);
      setTceResults([]);
      setIsOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.destinations || []);
      setSpecialResults(data.specialSections || []);
      setTceResults(data.tceArticles || []);
      setIsOpen(true);
      setSelectedIndex(-1);
      const totalCount = (data.destinations?.length ?? 0) + (data.specialSections?.length ?? 0) + (data.tceArticles?.length ?? 0);
      window.dispatchEvent(new CustomEvent("analytics-track", {
        detail: { type: "search", search_query: q, search_results: totalCount },
      }));
    } catch {
      setResults([]);
      setSpecialResults([]);
      setTceResults([]);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const totalResults = results.length + specialResults.length + tceResults.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, totalResults - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        router.push(`/destinations/${results[selectedIndex].slug}`);
        setIsOpen(false);
        setQuery("");
      } else if (selectedIndex >= results.length && selectedIndex < results.length + specialResults.length) {
        const idx = selectedIndex - results.length;
        router.push(`/special/${specialResults[idx].slug}`);
        setIsOpen(false);
        setQuery("");
      } else if (selectedIndex >= results.length + specialResults.length && selectedIndex < totalResults) {
        const idx = selectedIndex - results.length - specialResults.length;
        router.push(`/tce-resources#${tceResults[idx].slug}`);
        setIsOpen(false);
        setQuery("");
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/login";
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <header className={`flex items-center gap-4 border-b px-6 py-3 transition-colors ${
      isAdmin
        ? "bg-[#fdf6e9] border-[#d4b896] shadow-[0_1px_3px_rgba(180,150,100,0.06)]"
        : "bg-white border-[#b2cab8] shadow-[0_1px_3px_rgba(58,95,84,0.06)]"
    }`}>
      {isAdmin && (
        <div className="flex items-center gap-1.5 mr-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Admin</span>
        </div>
      )}
      <div className="relative flex-1 max-w-xl">
        <div className="relative group">
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
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search destinations..."
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0 || specialResults.length > 0 || tceResults.length > 0) setIsOpen(true);
            }}
            className="pl-10 pr-16 rounded-full bg-[#f1f6f3] border-transparent focus-within:bg-white focus-within:border-border transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-md border bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {isOpen && (results.length > 0 || specialResults.length > 0 || tceResults.length > 0) && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-white/95 backdrop-blur-sm shadow-[var(--shadow-lg)] max-h-80 overflow-y-auto"
          >
            {results.length > 0 && (
              <div className="p-1">
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  Destinations
                </div>
                {results.map((r, i) => (
                  <Link
                    key={r.id}
                    href={`/destinations/${r.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`block rounded-sm px-3 py-2 text-sm hover:bg-accent ${
                      i === selectedIndex ? "bg-accent" : ""
                    }`}
                  >
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.region_name}
                    </div>
                    {r.snippet && (
                      <div
                        className="text-xs text-muted-foreground mt-0.5 line-clamp-1"
                        dangerouslySetInnerHTML={{ __html: r.snippet }}
                      />
                    )}
                  </Link>
                ))}
              </div>
            )}
            {specialResults.length > 0 && (
              <div className="p-1 border-t">
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  Special Sections
                </div>
                {specialResults.map((s, i) => (
                  <Link
                    key={s.slug}
                    href={`/special/${s.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`block rounded-sm px-3 py-2 text-sm hover:bg-accent ${
                      i + results.length === selectedIndex ? "bg-accent" : ""
                    }`}
                  >
                    {s.title}
                  </Link>
                ))}
              </div>
            )}
            {tceResults.length > 0 && (
              <div className="p-1 border-t">
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  TCE Resources
                </div>
                {tceResults.slice(0, 5).map((t, i) => (
                  <Link
                    key={t.slug}
                    href={`/tce-resources#${t.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`block rounded-sm px-3 py-2 text-sm hover:bg-accent ${
                      i + results.length + specialResults.length === selectedIndex ? "bg-accent" : ""
                    }`}
                  >
                    {t.title}
                  </Link>
                ))}
              </div>
            )}
            <div className="border-t p-1">
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => {
                  setIsOpen(false);
                }}
                className="block rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                View all results for &ldquo;{query}&rdquo;
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-[#3a5f54] text-white text-xs font-semibold">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm text-muted-foreground">
              {user.name}
            </span>
          </div>
        )}
        {user?.role === 'admin' && !isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Admin
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

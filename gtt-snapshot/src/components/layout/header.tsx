"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { MyActivityDialog } from "@/components/layout/my-activity-dialog";
import { ThemeToggle } from "@/components/layout/theme-toggle";

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
  const [activityOpen, setActivityOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSearchRef = useRef<{ q: string; count: number } | null>(null);
  const trackedQueryRef = useRef<string>("");
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Record a search ONCE, when it settles — the previous code dispatched on
  // every debounced keystroke, so one search for "tanzania" logged as five
  // fragment searches and polluted the search analytics (and user stats).
  const trackSearchNow = useCallback(() => {
    const s = lastSearchRef.current;
    if (s && s.q.trim().length >= 2 && trackedQueryRef.current !== s.q) {
      trackedQueryRef.current = s.q;
      window.dispatchEvent(new CustomEvent("analytics-track", {
        detail: { type: "search", search_query: s.q, search_results: s.count },
      }));
    }
  }, []);
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
      lastSearchRef.current = { q, count: totalCount };
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
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(trackSearchNow, 1200);
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
        trackSearchNow();
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
    <header className={`flex items-center gap-4 border-b px-6 py-3.5 transition-colors ${
      isAdmin
        ? "bg-[#fdf6e9] border-[#e3d3ae] shadow-[0_1px_4px_rgba(180,150,100,0.08)] dark:bg-[#1c1708] dark:border-[#c9a227]/25"
        : "bg-[#fffdf8]/95 backdrop-blur border-[#e8e2d2] shadow-[0_1px_4px_rgba(14,77,92,0.05)] dark:bg-[#081c24]/95 dark:border-white/10"
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
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0e4d5c]/50 transition-colors group-focus-within:text-[#0e4d5c]"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search destinations, guides and more..."
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0 || specialResults.length > 0 || tceResults.length > 0) setIsOpen(true);
            }}
            className="h-11 pl-11 pr-16 rounded-full bg-[#faf6ee] border-[#e8e2d2] shadow-inner placeholder:text-muted-foreground/70 focus-visible:bg-white focus-visible:border-[#0e4d5c]/40 focus-visible:ring-4 focus-visible:ring-[#c9a227]/15 transition-all dark:bg-white/5 dark:border-white/10 dark:focus-visible:bg-[#0d232c]"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-md border border-[#e8e2d2] bg-white px-1.5 py-0.5 dark:border-white/15 dark:bg-white/10 text-[10px] font-medium text-muted-foreground shadow-sm">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {isOpen && (results.length > 0 || specialResults.length > 0 || tceResults.length > 0) && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl border border-[#e8e2d2] bg-white/97 backdrop-blur-sm dark:border-white/10 dark:bg-[#0d232c] shadow-[var(--shadow-lg)] max-h-80 overflow-y-auto"
          >
            {results.length > 0 && (
              <div className="p-1">
                <div className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0e4d5c]/55">
                  Destinations
                </div>
                {results.map((r, i) => (
                  <Link
                    key={r.id}
                    href={`/destinations/${r.slug}`}
                    onClick={() => {
                      trackSearchNow();
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`block rounded-sm px-3 py-2 text-sm hover:bg-[#faf6ee] dark:hover:bg-white/5 ${
                      i === selectedIndex ? "bg-[#faf6ee]" : ""
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
                <div className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0e4d5c]/55">
                  Special Sections
                </div>
                {specialResults.map((s, i) => (
                  <Link
                    key={s.slug}
                    href={`/special/${s.slug}`}
                    onClick={() => {
                      trackSearchNow();
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`block rounded-sm px-3 py-2 text-sm hover:bg-[#faf6ee] dark:hover:bg-white/5 ${
                      i + results.length === selectedIndex ? "bg-[#faf6ee]" : ""
                    }`}
                  >
                    {s.title}
                  </Link>
                ))}
              </div>
            )}
            {tceResults.length > 0 && (
              <div className="p-1 border-t">
                <div className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0e4d5c]/55">
                  TCE Resources
                </div>
                {tceResults.slice(0, 5).map((t, i) => (
                  <Link
                    key={t.slug}
                    href={`/tce-resources#${t.slug}`}
                    onClick={() => {
                      trackSearchNow();
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`block rounded-sm px-3 py-2 text-sm hover:bg-[#faf6ee] dark:hover:bg-white/5 ${
                      i + results.length + specialResults.length === selectedIndex ? "bg-[#faf6ee]" : ""
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
                className="block rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-[#faf6ee] dark:hover:bg-white/5"
              >
                View all results for &ldquo;{query}&rdquo;
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <div className="hidden h-9 w-px bg-[#e8e2d2] dark:bg-white/10 sm:block" />
        {user && (
          <button
            onClick={() => setActivityOpen(true)}
            title="Your activity on the Snapshot"
            className="group flex cursor-pointer items-center gap-3 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[#faf6ee] dark:hover:bg-white/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0e5a6e] to-[#07222b] text-[13px] font-semibold text-white ring-2 ring-[#c9a227]/60 ring-offset-2 ring-offset-[#fffdf8] dark:ring-offset-[#081c24] transition-transform group-hover:scale-[1.04]">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden text-left leading-tight md:block">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {user.role === 'admin' ? 'Administrator' : 'Advisor'}
              </p>
            </div>
          </button>
        )}
        {user?.role === 'admin' && !isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#0e4d5c]/30 bg-white px-3.5 py-1.5 text-sm font-medium text-[#0e4d5c] shadow-sm transition-all hover:bg-[#0e4d5c] hover:text-white dark:bg-transparent dark:text-[#6db3c4] dark:border-[#6db3c4]/40 dark:hover:bg-[#6db3c4] dark:hover:text-[#052530]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1-1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Admin
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-[#faf6ee] dark:hover:bg-white/5 hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
          Sign out
        </button>
      </div>

      {user && (
        <MyActivityDialog user={user} open={activityOpen} onOpenChange={setActivityOpen} />
      )}
    </header>
  );
}

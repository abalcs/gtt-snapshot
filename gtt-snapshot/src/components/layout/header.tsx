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

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [specialResults, setSpecialResults] = useState<SpecialSectionResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSpecialResults([]);
      setIsOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.destinations || []);
      setSpecialResults(data.specialSections || []);
      setIsOpen(true);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
      setSpecialResults([]);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const totalResults = results.length + specialResults.length;

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
      } else if (selectedIndex >= results.length && selectedIndex < totalResults) {
        const idx = selectedIndex - results.length;
        router.push(`/special/${specialResults[idx].slug}`);
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
    router.push("/");
    router.refresh();
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
        ? "bg-[#fdf6e9] border-[#d4b896]"
        : "bg-white border-[#b2cab8]"
    }`}>
      {isAdmin && (
        <div className="flex items-center gap-1.5 mr-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Admin</span>
        </div>
      )}
      <div className="relative flex-1 max-w-xl">
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search destinations... (⌘K)"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0 || specialResults.length > 0) setIsOpen(true);
            }}
            className="pl-9 pr-4"
          />
        </div>

        {isOpen && (results.length > 0 || specialResults.length > 0) && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg max-h-80 overflow-y-auto"
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
        {isAdmin ? (
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Logout
          </button>
        ) : (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Admin
          </Link>
        )}
      </div>
    </header>
  );
}

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TOCSection {
  id: string;
  label: string;
}

export function TableOfContents({ sections }: { sections: TOCSection[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  // Track when the TOC becomes sticky
  useEffect(() => {
    const sentinel = document.getElementById("toc-sentinel");
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  if (sections.length === 0) return null;

  return (
    <>
      <div id="toc-sentinel" className="h-0" />
      <div className={cn(
        "sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 transition-all duration-200 print:hidden",
        isSticky
          ? "bg-white/95 backdrop-blur-sm border-b shadow-sm"
          : "bg-transparent"
      )}>
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={cn(
                  "shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-150",
                  activeId === s.id
                    ? "bg-[#3a5f54] text-white border-[#3a5f54] shadow-sm"
                    : isSticky
                      ? "text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
                      : "text-muted-foreground/80 border-border/40 hover:bg-white/80 hover:text-foreground hover:border-border/60"
                )}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== previousPathname.current) {
      // Route changed — fade out, swap content, fade in
      setIsVisible(false);
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        previousPathname.current = pathname;
        setIsVisible(true);
      }, 150);
      return () => clearTimeout(timeout);
    } else {
      // Same route, just update children (e.g. initial load)
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className="transition-all duration-200 ease-in-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(4px)",
      }}
    >
      {displayChildren}
    </div>
  );
}

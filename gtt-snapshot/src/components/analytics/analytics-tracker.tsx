"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEvent } from "@/lib/analytics-types";

interface AnalyticsTrackerProps {
  userEmail: string;
  userName: string;
}

const FLUSH_INTERVAL = 30_000; // 30 seconds

export function AnalyticsTracker({ userEmail, userName }: AnalyticsTrackerProps) {
  const pathname = usePathname();
  const bufferRef = useRef<AnalyticsEvent[]>([]);
  const lastPathnameRef = useRef<string>("");

  const flush = useCallback(() => {
    const events = bufferRef.current;
    if (events.length === 0) return;
    bufferRef.current = [];

    const payload = JSON.stringify({ events });

    // Try sendBeacon first (works on tab close), fall back to fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/events", payload);
    } else {
      fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, []);

  const addEvent = useCallback((event: AnalyticsEvent) => {
    bufferRef.current.push(event);
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (pathname === lastPathnameRef.current) return;
    lastPathnameRef.current = pathname;

    // Extract destination slug from /destinations/[slug]
    const destMatch = pathname.match(/^\/destinations\/([^/]+)/);
    const destination = destMatch ? destMatch[1] : undefined;

    addEvent({
      type: "page_view",
      timestamp: new Date().toISOString(),
      path: pathname,
      destination,
    });
  }, [pathname, addEvent]);

  // Listen for custom analytics events from other components
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.type) {
        addEvent({
          ...detail,
          timestamp: new Date().toISOString(),
          path: pathname,
        });
      }
    };

    window.addEventListener("analytics-track", handler);
    return () => window.removeEventListener("analytics-track", handler);
  }, [pathname, addEvent]);

  // Flush on interval
  useEffect(() => {
    const interval = setInterval(flush, FLUSH_INTERVAL);
    return () => clearInterval(interval);
  }, [flush]);

  // Flush on tab hide / beforeunload
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };
    const handleBeforeUnload = () => {
      flush();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [flush]);

  return null;
}

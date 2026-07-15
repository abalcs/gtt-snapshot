"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEvent } from "@/lib/analytics-types";

interface AnalyticsTrackerProps {
  userEmail: string;
  userName: string;
}

const FLUSH_INTERVAL = 30_000; // 30 seconds
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AnalyticsTracker({ userEmail, userName }: AnalyticsTrackerProps) {
  const pathname = usePathname();
  const bufferRef = useRef<AnalyticsEvent[]>([]);
  const lastPathnameRef = useRef<string>("");
  const pageEnteredAtRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(generateSessionId());
  const lastActivityRef = useRef<number>(Date.now());

  const getSessionId = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > SESSION_TIMEOUT) {
      sessionIdRef.current = generateSessionId();
    }
    lastActivityRef.current = now;
    return sessionIdRef.current;
  }, []);

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
    bufferRef.current.push({ ...event, session_id: getSessionId() });
  }, [getSessionId]);

  // Track page views on route change + emit page_leave for previous page
  useEffect(() => {
    if (pathname === lastPathnameRef.current) return;

    // Emit page_leave for previous page
    if (lastPathnameRef.current && pageEnteredAtRef.current > 0) {
      const dwellMs = Date.now() - pageEnteredAtRef.current;
      const prevDest = lastPathnameRef.current.match(/^\/destinations\/([^/]+)/);
      addEvent({
        type: "page_leave",
        timestamp: new Date().toISOString(),
        path: lastPathnameRef.current,
        destination: prevDest ? prevDest[1] : undefined,
        dwell_ms: dwellMs,
      });
    }

    lastPathnameRef.current = pathname;
    pageEnteredAtRef.current = Date.now();

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

  // Flush on tab hide / beforeunload (also emit page_leave)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        // Emit page_leave for current page before flushing
        if (lastPathnameRef.current && pageEnteredAtRef.current > 0) {
          const dwellMs = Date.now() - pageEnteredAtRef.current;
          const destMatch = lastPathnameRef.current.match(/^\/destinations\/([^/]+)/);
          addEvent({
            type: "page_leave",
            timestamp: new Date().toISOString(),
            path: lastPathnameRef.current,
            destination: destMatch ? destMatch[1] : undefined,
            dwell_ms: dwellMs,
          });
          pageEnteredAtRef.current = 0; // prevent duplicate
        }
        flush();
      }
    };
    const handleBeforeUnload = () => {
      if (lastPathnameRef.current && pageEnteredAtRef.current > 0) {
        const dwellMs = Date.now() - pageEnteredAtRef.current;
        const destMatch = lastPathnameRef.current.match(/^\/destinations\/([^/]+)/);
        addEvent({
          type: "page_leave",
          timestamp: new Date().toISOString(),
          path: lastPathnameRef.current,
          destination: destMatch ? destMatch[1] : undefined,
          dwell_ms: dwellMs,
        });
        pageEnteredAtRef.current = 0;
      }
      flush();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [flush, addEvent]);

  return null;
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const LOGOUT_COUNTDOWN_S = 60; // 60 seconds
const THROTTLE_MS = 1000;

export function IdleTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(LOGOUT_COUNTDOWN_S);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const lastActivityRef = useRef(Date.now());

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = undefined;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = undefined;
    }
  }, []);

  const logout = useCallback(async () => {
    clearAllTimers();
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }, [clearAllTimers]);

  const startCountdown = useCallback(() => {
    setSecondsLeft(LOGOUT_COUNTDOWN_S);
    setShowWarning(true);

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [logout]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(startCountdown, IDLE_TIMEOUT_MS);
  }, [startCountdown]);

  const handleStayLoggedIn = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setSecondsLeft(LOGOUT_COUNTDOWN_S);
    resetIdleTimer();
  }, [clearAllTimers, resetIdleTimer]);

  // Set up activity listeners and initial idle timer
  useEffect(() => {
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < THROTTLE_MS) return;
      lastActivityRef.current = now;
      // Only reset if warning is not showing
      if (!idleTimerRef.current) return;
      resetIdleTimer();
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
    for (const event of events) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    // Start the initial idle timer
    resetIdleTimer();

    return () => {
      for (const event of events) {
        document.removeEventListener(event, handleActivity);
      }
      clearAllTimers();
    };
  }, [resetIdleTimer, clearAllTimers]);

  // When warning shows, stop resetting idle timer on activity
  useEffect(() => {
    if (showWarning) {
      // Clear the idle timer so activity events don't restart it
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = undefined;
      }
    }
  }, [showWarning]);

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Session Timeout Warning</DialogTitle>
          <DialogDescription>
            You&apos;ve been inactive for a while. You will be logged out in{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {secondsLeft}
            </span>{" "}
            {secondsLeft === 1 ? "second" : "seconds"}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleStayLoggedIn}>Stay Logged In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

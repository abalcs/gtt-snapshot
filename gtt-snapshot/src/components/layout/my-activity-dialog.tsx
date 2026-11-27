"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MyActivity } from "@/lib/my-activity";

interface MyActivityDialogProps {
  user: { name: string; role: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDay(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso.length <= 10 ? iso + "T12:00:00" : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-[#faf6ee] px-4 py-3 text-center ring-1 ring-[#e8e2d2]">
      <p className="font-serif text-2xl font-semibold text-[#0e4d5c]">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function MyActivityDialog({ user, open, onOpenChange }: MyActivityDialogProps) {
  const [activity, setActivity] = useState<MyActivity | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFailed(false);
    fetch("/api/me/activity")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setActivity(data as MyActivity);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open ]);

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const since = formatDay(activity?.firstDay ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="bg-gradient-to-r from-[#0d4256] to-[#07222b] px-6 py-5">
          <DialogHeader>
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-base font-semibold text-white ring-2 ring-[#c9a227]/70">
                {initials}
              </div>
              <div className="text-left">
                <DialogTitle className="font-serif text-xl text-white">{user.name}</DialogTitle>
                <DialogDescription className="text-white/60">
                  {user.role === "admin" ? "Administrator" : "Advisor"}
                  {since ? ` · exploring since ${since}` : ""}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5">
          {failed ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Your activity could not be loaded just now. Try again in a moment.
            </p>
          ) : !activity ? (
            <div className="grid grid-cols-2 gap-3 py-1" aria-label="Loading your activity">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[74px] animate-pulse rounded-xl bg-[#faf6ee]" />
              ))}
            </div>
          ) : !activity.hasData ? (
            <div className="py-2 text-center">
              <p className="font-serif text-lg font-semibold text-[#0e4d5c]">Your story starts now</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
                As you browse destinations and search the Snapshot, your personal stats will
                appear here: pages viewed, searches, your most explored places and more.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <StatTile value={activity.totalPageViews} label="Pages viewed" />
                <StatTile value={activity.totalSearches} label="Searches made" />
                <StatTile value={activity.activeDaysCount} label="Active days" />
                <StatTile value={activity.destinationsExplored} label="Destinations explored" />
              </div>

              {(activity.streakDays >= 2 || activity.rank !== null) && (
                <div className="space-y-1.5 rounded-xl bg-[#0e4d5c]/[.04] px-4 py-3 ring-1 ring-[#0e4d5c]/10">
                  {activity.streakDays >= 2 && (
                    <p className="text-sm text-foreground">
                      You are on a <strong>{activity.streakDays}-day streak</strong> of active days.
                    </p>
                  )}
                  {activity.rank !== null && activity.teamSize > 1 && (
                    <p className="text-sm text-foreground">
                      You are the <strong>{ordinal(activity.rank)} most active</strong> of{" "}
                      {activity.teamSize} people on the team
                      {activity.moreActiveThanPct !== null &&
                        `, ahead of ${activity.moreActiveThanPct}% of them`}
                      .
                    </p>
                  )}
                </div>
              )}

              {activity.topDestinations.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0e4d5c]/55">
                    Your most explored destinations
                  </p>
                  <ul className="mt-2 divide-y divide-[#e8e2d2] rounded-xl ring-1 ring-[#e8e2d2]">
                    {activity.topDestinations.map((d, i) => (
                      <li key={d.slug} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm">
                          <span className="mr-2 font-serif font-semibold text-[#c9a227]">
                            {i + 1}
                          </span>
                          {d.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {d.views} view{d.views !== 1 ? "s" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {activity.topRegion && (
                    <p className="mt-2.5 text-sm text-muted-foreground">
                      Your most explored region is{" "}
                      <span className="font-medium text-foreground">{activity.topRegion.name}</span>{" "}
                      ({activity.topRegion.views} views).
                    </p>
                  )}
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                {activity.sessionsCount > 0 &&
                  `${activity.sessionsCount} visit${activity.sessionsCount !== 1 ? "s" : ""} so far · `}
                Stats build from how you use the Snapshot, and only you and the admins can see them.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

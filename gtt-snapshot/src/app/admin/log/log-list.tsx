"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AdminLogEntry } from "@/lib/types";

const actionColors: Record<string, string> = {
  created: "bg-green-100 text-green-800 border-green-200",
  updated: "bg-blue-100 text-blue-800 border-blue-200",
  deleted: "bg-red-100 text-red-800 border-red-200",
};

const actionLabels: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
};

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relative: string;
  if (diffMins < 1) relative = "just now";
  else if (diffMins < 60) relative = `${diffMins}m ago`;
  else if (diffHours < 24) relative = `${diffHours}h ago`;
  else if (diffDays < 7) relative = `${diffDays}d ago`;
  else relative = date.toLocaleDateString();

  return {
    relative,
    full: date.toLocaleString(),
  };
}

function formatFieldName(field: string) {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

export function AdminLogList({ logs }: { logs: AdminLogEntry[] }) {
  const [selectedLog, setSelectedLog] = useState<AdminLogEntry | null>(null);

  // Group logs by date
  const grouped = new Map<string, AdminLogEntry[]>();
  for (const log of logs) {
    const dateKey = new Date(log.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(log);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Recent admin changes ({logs.length} entries)
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-primary hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No activity recorded yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Changes made through the admin panel will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([date, entries]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              {date}
            </h2>
            <div className="space-y-3">
              {entries.map((log) => {
                const time = formatTimestamp(log.timestamp);
                const hasChanges = log.changes.length > 0;
                return (
                  <Card
                    key={log.id}
                    className={hasChanges ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
                    onClick={() => hasChanges && setSelectedLog(log)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-xs ${actionColors[log.action]}`}
                            >
                              {actionLabels[log.action]}
                            </Badge>
                            <span className="font-medium truncate">
                              {log.target_name}
                            </span>
                          </div>

                          {hasChanges && (
                            <p className="text-sm text-muted-foreground mt-1.5">
                              {log.changes.length} field{log.changes.length !== 1 ? "s" : ""} changed
                              <span className="ml-1.5 text-xs text-primary">
                                — click to view details
                              </span>
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>by {log.updated_by}</span>
                            <span>&middot;</span>
                            <span title={time.full}>{time.relative}</span>
                          </div>
                        </div>
                        {hasChanges && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0 mt-1"><path d="m9 18 6-6-6-6"/></svg>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        {selectedLog && (
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${actionColors[selectedLog.action]}`}
                >
                  {actionLabels[selectedLog.action]}
                </Badge>
                {selectedLog.target_name}
              </DialogTitle>
              <DialogDescription>
                {selectedLog.action === "updated"
                  ? `${selectedLog.changes.length} field${selectedLog.changes.length !== 1 ? "s" : ""} changed`
                  : selectedLog.action === "created"
                  ? "New destination created"
                  : "Destination deleted"}
                {" "}by {selectedLog.updated_by} on{" "}
                {new Date(selectedLog.timestamp).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {selectedLog.changes.map((change, i) => (
                <div key={i} className="rounded-lg border overflow-hidden">
                  <div className="bg-muted px-4 py-2">
                    <span className="text-sm font-semibold">
                      {formatFieldName(change.field)}
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {change.from && (
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wide text-red-600/70 block mb-1">
                          Before
                        </span>
                        <div className="text-sm bg-red-50 border border-red-100 rounded px-3 py-2 whitespace-pre-wrap break-words">
                          {change.from}
                        </div>
                      </div>
                    )}
                    {change.to && (
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wide text-green-700 block mb-1">
                          After
                        </span>
                        <div className="text-sm bg-green-50 border border-green-100 rounded px-3 py-2 whitespace-pre-wrap break-words">
                          {change.to}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter showCloseButton>
              {selectedLog.action !== "deleted" && (
                <Link href={`/destinations/${selectedLog.target_slug}`}>
                  <Button variant="outline" size="sm">
                    View Destination
                  </Button>
                </Link>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

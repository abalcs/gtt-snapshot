"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

function formatRelativeTime(ts: string) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatFieldName(field: string) {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function summarizeChanges(changes: AdminLogEntry["changes"]): string {
  if (changes.length === 0) return "";
  if (changes.length <= 2) {
    return changes.map((c) => formatFieldName(c.field).toLowerCase()).join(" and ");
  }
  return `${formatFieldName(changes[0].field).toLowerCase()} and ${changes.length - 1} other fields`;
}

export function WhatsNewFeed({ logs }: { logs: AdminLogEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No recent changes.</p>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const isExpanded = expandedId === log.id;
        const summary = summarizeChanges(log.changes);

        return (
          <div key={log.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs ${actionColors[log.action]}`}
                >
                  {actionLabels[log.action]}
                </Badge>
                {log.action !== "deleted" ? (
                  <Link
                    href={`/destinations/${log.target_slug}`}
                    className="font-medium text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {log.target_name}
                  </Link>
                ) : (
                  <span className="font-medium text-sm">{log.target_name}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {summary && (
                  <>
                    <span className="capitalize">{log.action} {summary}</span>
                    <span>&middot;</span>
                  </>
                )}
                <span>{formatRelativeTime(log.timestamp)}</span>
                <span>&middot;</span>
                <span>{log.updated_by}</span>
                {log.changes.length > 0 && (
                  <span className="ml-auto text-xs">
                    {isExpanded ? "Hide" : "Details"}
                  </span>
                )}
              </div>
            </button>

            {isExpanded && log.changes.length > 0 && (
              <div className="border-t px-4 py-3 bg-muted/30 space-y-2">
                {log.changes.map((change, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-xs">{formatFieldName(change.field)}</span>
                    {change.from && (
                      <div className="text-xs text-red-600/70 mt-0.5 line-clamp-2">
                        - {change.from}
                      </div>
                    )}
                    {change.to && (
                      <div className="text-xs text-green-700 mt-0.5 line-clamp-2">
                        + {change.to}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminLogs } from "@/lib/queries";

export const dynamic = 'force-dynamic';

const actionColors = {
  created: "bg-green-100 text-green-800 border-green-200",
  updated: "bg-blue-100 text-blue-800 border-blue-200",
  deleted: "bg-red-100 text-red-800 border-red-200",
};

const actionLabels = {
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

export default async function AdminLogPage() {
  const logs = await getAdminLogs(100);

  // Group logs by date
  const grouped = new Map<string, typeof logs>();
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
                return (
                  <Card key={log.id}>
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
                            {log.action !== "deleted" ? (
                              <Link
                                href={`/destinations/${log.target_slug}`}
                                className="font-medium hover:underline truncate"
                              >
                                {log.target_name}
                              </Link>
                            ) : (
                              <span className="font-medium text-muted-foreground line-through truncate">
                                {log.target_name}
                              </span>
                            )}
                          </div>

                          {log.changes.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {log.changes.map((change, i) => (
                                <div
                                  key={i}
                                  className="text-sm flex items-start gap-1.5"
                                >
                                  <span className="text-muted-foreground font-medium shrink-0">
                                    {formatFieldName(change.field)}:
                                  </span>
                                  {change.from && (
                                    <span className="text-red-600/70 line-through break-all">
                                      {change.from.length > 80
                                        ? change.from.slice(0, 80) + "..."
                                        : change.from}
                                    </span>
                                  )}
                                  {change.from && change.to && (
                                    <span className="text-muted-foreground shrink-0">&rarr;</span>
                                  )}
                                  {change.to && (
                                    <span className="text-green-700 break-all">
                                      {change.to.length > 80
                                        ? change.to.slice(0, 80) + "..."
                                        : change.to}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>by {log.updated_by}</span>
                            <span>&middot;</span>
                            <span title={time.full}>{time.relative}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

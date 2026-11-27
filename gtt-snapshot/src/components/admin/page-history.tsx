"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RevisionMeta {
  id: string;
  saved_at: string;
  editor: string;
  title: string;
  status: string;
}

/**
 * Version history for a Page Manager page. Every save snapshots the previous
 * version; restoring one snapshots the current state first, so a restore can
 * itself be undone from this same list.
 */
export function PageHistory({ pageId }: { pageId: string }) {
  const [revisions, setRevisions] = useState<RevisionMeta[] | null>(null);
  const [confirming, setConfirming] = useState<RevisionMeta | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/pages/${pageId}/revisions`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setRevisions(data.revisions ?? []);
    } catch {
      setRevisions([]);
    }
  }, [pageId]);

  useEffect(() => {
    load();
  }, [load]);

  const restore = async () => {
    if (!confirming) return;
    setRestoring(true);
    setError("");
    try {
      const res = await fetch(`/api/pages/${pageId}/revisions/${confirming.id}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Restore failed");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed");
      setRestoring(false);
    }
  };

  if (revisions === null || revisions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Version History</CardTitle>
        <p className="text-sm text-muted-foreground">
          Every save keeps a copy of the page as it was. Restoring a version also saves the current
          one here first, so a restore can be undone.
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        {revisions.map((rev) => (
          <div
            key={rev.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-muted/50"
          >
            <div className="text-sm">
              <span className="font-medium">
                {rev.saved_at ? new Date(rev.saved_at).toLocaleString() : "Unknown date"}
              </span>
              {rev.editor && <span className="text-muted-foreground"> · saved by {rev.editor}</span>}
              {rev.status && <span className="text-muted-foreground"> · was {rev.status}</span>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setConfirming(rev)}>
              Restore
            </Button>
          </div>
        ))}
      </CardContent>

      <Dialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore this version?</DialogTitle>
            <DialogDescription>
              The page will go back to how it was on{" "}
              {confirming ? new Date(confirming.saved_at).toLocaleString() : ""}. The current version
              is saved to this history first, so you can undo the restore afterwards.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)} disabled={restoring}>
              Cancel
            </Button>
            <Button onClick={restore} disabled={restoring} className="bg-[#0e4d5c] hover:bg-[#0d4256]">
              {restoring ? "Restoring…" : "Restore this version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

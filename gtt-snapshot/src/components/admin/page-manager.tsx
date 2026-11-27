"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PageDoc } from "@/lib/types";
import { PAGE_SECTIONS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PageManager({ initialPages }: { initialPages: PageDoc[] }) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageDoc | null>(null);
  const [confirmSlug, setConfirmSlug] = useState("");

  const sections = useMemo(() => {
    const known = PAGE_SECTIONS as readonly string[];
    const extra = [...new Set(pages.map((p) => p.section))].filter((s) => !known.includes(s));
    return [...known, ...extra];
  }, [pages]);

  async function move(page: PageDoc, dir: -1 | 1) {
    const siblings = pages
      .filter((p) => p.section === page.section)
      .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
    const idx = siblings.findIndex((p) => p.id === page.id);
    const swapIdx = idx + dir;
    if (idx === -1 || swapIdx < 0 || swapIdx >= siblings.length) return;
    const ordered = [...siblings];
    [ordered[idx], ordered[swapIdx]] = [ordered[swapIdx], ordered[idx]];
    setBusy(page.id);
    setError(null);
    try {
      const res = await fetch("/api/pages/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ordered.map((p) => p.id) }),
      });
      if (!res.ok) throw new Error("Reorder failed");
      const orderMap = new Map(ordered.map((p, i) => [p.id, i]));
      setPages((prev) =>
        prev.map((p) => (orderMap.has(p.id) ? { ...p, sort_order: orderMap.get(p.id)! } : p))
      );
      router.refresh();
    } catch {
      setError("Could not save the new order. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleVisible(page: PageDoc) {
    setBusy(page.id);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !page.visible }),
      });
      if (!res.ok) throw new Error("Update failed");
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, visible: !p.visible } : p)));
      router.refresh();
    } catch {
      setError("Could not update visibility. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmRemove() {
    if (!deleteTarget) return;
    const page = deleteTarget;
    setBusy(page.id);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPages((prev) => prev.filter((p) => p.id !== page.id));
      setDeleteTarget(null);
      setConfirmSlug("");
      router.refresh();
    } catch {
      setError("Could not delete the page. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function duplicate(page: PageDoc) {
    setBusy(page.id);
    setError(null);
    try {
      const taken = new Set(pages.map((p) => p.slug));
      let slug = `${page.slug}-copy`;
      let n = 2;
      while (taken.has(slug)) slug = `${page.slug}-copy-${n++}`;
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${page.title} (copy)`,
          slug,
          section: page.section,
          icon: page.icon,
          status: "draft",
          visible: true,
          blocks: page.blocks,
        }),
      });
      if (!res.ok) throw new Error("Duplicate failed");
      const created: PageDoc = {
        ...page,
        id: slug,
        slug,
        title: `${page.title} (copy)`,
        status: "draft",
        visible: true,
        sort_order: Math.max(0, ...pages.filter((p) => p.section === page.section).map((p) => p.sort_order)) + 1,
      };
      setPages((prev) => [...prev, created]);
      router.refresh();
    } catch {
      setError("Could not duplicate the page. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Page Manager</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit and organise the guide pages in the sidebar. No code needed.
          </p>
        </div>
        <Link href="/admin/pages/new">
          <Button className="bg-[#0e4d5c] hover:bg-[#0d4256]">New Page</Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      {sections.map((section) => {
        const inSection = pages
          .filter((p) => p.section === section)
          .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
        if (inSection.length === 0) return null;
        return (
          <Card key={section}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {section} <span className="text-muted-foreground font-normal">({inSection.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              {inSection.map((page, i) => (
                <div key={page.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <div className="flex flex-col mr-1">
                    <button
                      onClick={() => move(page, -1)}
                      disabled={busy === page.id || i === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(page, 1)}
                      disabled={busy === page.id || i === inSection.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{page.title}</span>
                      {page.status === "draft" && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                          Draft
                        </span>
                      )}
                      {!page.visible && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">/p/{page.slug} · {page.blocks.length} block{page.blocks.length === 1 ? "" : "s"}</div>
                  </div>
                  <Link href={`/p/${page.slug}`} target="_blank" className="text-xs text-[#0e4d5c] hover:underline">
                    View
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => toggleVisible(page)} disabled={busy === page.id}>
                    {page.visible ? "Hide" : "Show"}
                  </Button>
                  <Link href={`/admin/pages/${page.id}/edit`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => duplicate(page)} disabled={busy === page.id}>
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setDeleteTarget(page); setConfirmSlug(""); }}
                    disabled={busy === page.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setConfirmSlug(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this page?</DialogTitle>
            <DialogDescription>
              You are about to permanently delete{" "}
              <strong className="text-foreground">{deleteTarget?.title}</strong>
              {deleteTarget && (
                <>
                  {" "}at <span className="font-mono text-[13px]">/p/{deleteTarget.slug}</span>, in the{" "}
                  {deleteTarget.section} section of the sidebar.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-3">
              <div className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
                This removes the page and its sidebar link straight away. Anyone who has
                bookmarked it will land on a “page not found” message.{" "}
                <strong>This cannot be undone.</strong>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-muted px-2 py-2">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-0.5 font-semibold capitalize">{deleteTarget.status}</dd>
                </div>
                <div className="rounded-md bg-muted px-2 py-2">
                  <dt className="text-muted-foreground">Content blocks</dt>
                  <dd className="mt-0.5 font-semibold">{deleteTarget.blocks.length}</dd>
                </div>
                <div className="rounded-md bg-muted px-2 py-2">
                  <dt className="text-muted-foreground">Sidebar</dt>
                  <dd className="mt-0.5 font-semibold">{deleteTarget.visible ? "Visible" : "Hidden"}</dd>
                </div>
              </dl>
              {deleteTarget.status === "published" && (
                <div className="space-y-1.5">
                  <label htmlFor="confirm-slug" className="text-sm font-medium">
                    This page is live. Type its slug to confirm:{" "}
                    <span className="font-mono text-[13px]">{deleteTarget.slug}</span>
                  </label>
                  <Input
                    id="confirm-slug"
                    value={confirmSlug}
                    onChange={(e) => setConfirmSlug(e.target.value)}
                    placeholder={deleteTarget.slug}
                    autoComplete="off"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setConfirmSlug(""); }}>
              Keep page
            </Button>
            <Button
              onClick={confirmRemove}
              disabled={
                !deleteTarget ||
                busy === deleteTarget.id ||
                (deleteTarget.status === "published" && confirmSlug.trim() !== deleteTarget.slug)
              }
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteTarget && busy === deleteTarget.id ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pages.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No pages yet. Create the first one with the New Page button.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

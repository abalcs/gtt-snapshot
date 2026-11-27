"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PageBlock, PageDoc } from "@/lib/types";
import { PAGE_ICONS, PAGE_SECTIONS } from "@/lib/types";
import { BlockRenderer } from "@/components/pages/block-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHistory } from "@/components/admin/page-history";

const BLOCK_LABELS: Record<PageBlock["type"], string> = {
  heading: "Heading",
  richtext: "Text (markdown)",
  callout: "Callout box",
  checklist: "Checklist",
  table: "Table",
  accordion: "Accordion (expandable sections)",
  links: "Link cards",
  cta: "Banner with button",
  divider: "Divider line",
};

function newBlock(type: PageBlock["type"]): PageBlock {
  switch (type) {
    case "heading": return { type, text: "", level: 2 };
    case "richtext": return { type, markdown: "" };
    case "callout": return { type, tone: "info", title: "", text: "" };
    case "checklist": return { type, items: [""] };
    case "table": return { type, headers: ["", ""], rows: [["", ""]] };
    case "accordion": return { type, items: [{ title: "", body: "" }] };
    case "links": return { type, items: [{ label: "", href: "", description: "" }] };
    case "cta": return { type, label: "", href: "", text: "" };
    case "divider": return { type };
  }
}

function slugPreview(title: string, slug: string): string {
  const base = (slug || title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "…";
}

export function PageEditor({ page }: { page?: PageDoc }) {
  const router = useRouter();
  const isNew = !page;
  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [summary, setSummary] = useState(page?.summary ?? "");
  const [icon, setIcon] = useState(page?.icon ?? "book");
  const [section, setSection] = useState(page?.section ?? "Guides");
  const [status, setStatus] = useState<"published" | "draft">(page?.status ?? "published");
  const [visible, setVisible] = useState(page?.visible !== false);
  const [blocks, setBlocks] = useState<PageBlock[]>(page?.blocks ?? [{ type: "richtext", markdown: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addType, setAddType] = useState<PageBlock["type"]>("richtext");

  const previewPage = useMemo(
    () => ({ blocks }),
    [blocks]
  );

  function updateBlock(i: number, next: PageBlock) {
    setBlocks((prev) => prev.map((b, j) => (j === i ? next : b)));
  }

  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function save() {
    if (!title.trim()) {
      setError("Give the page a title first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { title: title.trim(), summary, icon, section, status, visible, blocks };
      const res = isNew
        ? await fetch("/api/pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, slug: slug.trim() || undefined }),
          })
        : await fetch(`/api/pages/${page!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push("/admin/pages");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isNew ? "New Page" : `Edit: ${page!.title}`}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/pages" className="hover:underline">Page Manager</Link>
            {" / "}
            {isNew ? "New page" : page!.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/pages">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={save} disabled={saving} className="bg-[#0e4d5c] hover:bg-[#0d4256]">
            {saving ? "Saving…" : "Save Page"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Page details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pe-title">Title</Label>
                <Input id="pe-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cruise Information" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pe-slug">Web address</Label>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">/p/</span>
                  <Input
                    id="pe-slug"
                    value={isNew ? slug : page!.slug}
                    disabled={!isNew}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder={slugPreview(title, "")}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isNew
                    ? "Leave blank to use the title. The address cannot be changed later."
                    : "The address stays fixed so existing links keep working."}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pe-summary">Summary (shown under the title)</Label>
                <Textarea id="pe-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pe-section">Sidebar section</Label>
                  <select
                    id="pe-section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {PAGE_SECTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pe-icon">Icon</Label>
                  <select
                    id="pe-icon"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {PAGE_ICONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pe-status">Status</Label>
                  <select
                    id="pe-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft (admins only)</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 accent-[#0e4d5c]" />
                    Show in sidebar
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Content blocks</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {blocks.map((block, i) => (
                <div key={i} className="rounded-lg border border-border/70 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {BLOCK_LABELS[block.type]}
                    </span>
                    <span className="flex gap-1">
                      <button onClick={() => moveBlock(i, -1)} className="px-1.5 text-muted-foreground hover:text-foreground" title="Move up">▲</button>
                      <button onClick={() => moveBlock(i, 1)} className="px-1.5 text-muted-foreground hover:text-foreground" title="Move down">▼</button>
                      <button
                        onClick={() => setBlocks((prev) => prev.filter((_, j) => j !== i))}
                        className="px-1.5 text-red-500 hover:text-red-700"
                        title="Remove block"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                  <BlockFields block={block} onChange={(next) => updateBlock(i, next)} />
                </div>
              ))}

              <div className="flex items-center gap-2 pt-1">
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as PageBlock["type"])}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {(Object.keys(BLOCK_LABELS) as PageBlock["type"][]).map((t) => (
                    <option key={t} value={t}>{BLOCK_LABELS[t]}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={() => setBlocks((prev) => [...prev, newBlock(addType)])}>
                  Add block
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-b-2 border-[#c9a227]/60 pb-3 mb-4">
                <h2 className="text-2xl font-bold tracking-tight">{title || "Untitled page"}</h2>
                {summary && <p className="mt-1 text-sm text-muted-foreground">{summary}</p>}
              </div>
              <BlockRenderer blocks={previewPage.blocks} />
            </CardContent>
          </Card>
        </div>
      </div>
      {!isNew && page && <PageHistory pageId={page.id} />}
    </div>
  );
}

function linesToItems(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

function BlockFields({ block, onChange }: { block: PageBlock; onChange: (b: PageBlock) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <div className="flex gap-2">
          <Input value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Heading text" className="flex-1" />
          <select
            value={block.level ?? 2}
            onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 2 | 3 })}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm"
          >
            <option value={2}>Large</option>
            <option value={3}>Small</option>
          </select>
        </div>
      );
    case "richtext":
      return (
        <div className="space-y-1.5">
          <Textarea
            value={block.markdown}
            onChange={(e) => onChange({ ...block, markdown: e.target.value })}
            rows={9}
            className="font-mono text-xs"
            placeholder={"Write the content here…"}
          />
          <p className="text-xs text-muted-foreground">
            Formatting: ## heading, - bullet list, **bold**, [link text](https://…), and tables like | A | B | on their own lines.
          </p>
        </div>
      );
    case "callout":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={block.tone}
              onChange={(e) => onChange({ ...block, tone: e.target.value as "info" | "warning" | "tip" })}
              className="rounded-md border border-input bg-background px-2 py-2 text-sm"
            >
              <option value="info">Info</option>
              <option value="warning">Worth knowing</option>
              <option value="tip">Tip</option>
            </select>
            <Input value={block.title ?? ""} onChange={(e) => onChange({ ...block, title: e.target.value })} placeholder="Title (optional)" className="flex-1" />
          </div>
          <Textarea value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} rows={3} />
        </div>
      );
    case "checklist":
      return (
        <div className="space-y-1.5">
          <Textarea
            value={block.items.join("\n")}
            onChange={(e) => onChange({ ...block, items: linesToItems(e.target.value) })}
            rows={5}
            placeholder="One item per line"
          />
          <p className="text-xs text-muted-foreground">One item per line.</p>
        </div>
      );
    case "table":
      return (
        <div className="space-y-2">
          <Input
            value={block.headers.join(", ")}
            onChange={(e) => onChange({ ...block, headers: e.target.value.split(",").map((s) => s.trim()) })}
            placeholder="Column headings, separated by commas"
          />
          <Textarea
            value={block.rows.map((r) => r.join(", ")).join("\n")}
            onChange={(e) =>
              onChange({
                ...block,
                rows: e.target.value.split("\n").filter((l) => l.trim()).map((l) => l.split(",").map((s) => s.trim())),
              })
            }
            rows={5}
            placeholder="One row per line, cells separated by commas"
          />
        </div>
      );
    case "accordion":
      return (
        <div className="space-y-3">
          {block.items.map((item, j) => (
            <div key={j} className="space-y-1.5 rounded border border-border/60 p-2">
              <div className="flex gap-2">
                <Input
                  value={item.title}
                  onChange={(e) =>
                    onChange({ ...block, items: block.items.map((it, k) => (k === j ? { ...it, title: e.target.value } : it)) })
                  }
                  placeholder="Section title"
                  className="flex-1"
                />
                <button
                  onClick={() => onChange({ ...block, items: block.items.filter((_, k) => k !== j) })}
                  className="px-1 text-red-500 hover:text-red-700"
                  title="Remove section"
                >
                  ✕
                </button>
              </div>
              <Textarea
                value={item.body}
                onChange={(e) =>
                  onChange({ ...block, items: block.items.map((it, k) => (k === j ? { ...it, body: e.target.value } : it)) })
                }
                rows={4}
                className="font-mono text-xs"
                placeholder="Section content (markdown works here too)"
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => onChange({ ...block, items: [...block.items, { title: "", body: "" }] })}>
            Add section
          </Button>
        </div>
      );
    case "links":
      return (
        <div className="space-y-3">
          {block.items.map((item, j) => (
            <div key={j} className="space-y-1.5 rounded border border-border/60 p-2">
              <div className="flex gap-2">
                <Input
                  value={item.label}
                  onChange={(e) =>
                    onChange({ ...block, items: block.items.map((it, k) => (k === j ? { ...it, label: e.target.value } : it)) })
                  }
                  placeholder="Card title"
                  className="flex-1"
                />
                <button
                  onClick={() => onChange({ ...block, items: block.items.filter((_, k) => k !== j) })}
                  className="px-1 text-red-500 hover:text-red-700"
                  title="Remove card"
                >
                  ✕
                </button>
              </div>
              <Input
                value={item.href}
                onChange={(e) =>
                  onChange({ ...block, items: block.items.map((it, k) => (k === j ? { ...it, href: e.target.value } : it)) })
                }
                placeholder="Link address, e.g. /destinations/kenya or https://…"
              />
              <Input
                value={item.description ?? ""}
                onChange={(e) =>
                  onChange({ ...block, items: block.items.map((it, k) => (k === j ? { ...it, description: e.target.value } : it)) })
                }
                placeholder="Short description (optional)"
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => onChange({ ...block, items: [...block.items, { label: "", href: "", description: "" }] })}>
            Add card
          </Button>
        </div>
      );
    case "cta":
      return (
        <div className="space-y-2">
          <Input value={block.text ?? ""} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Banner text" />
          <div className="flex gap-2">
            <Input value={block.label} onChange={(e) => onChange({ ...block, label: e.target.value })} placeholder="Button label" className="flex-1" />
            <Input value={block.href} onChange={(e) => onChange({ ...block, href: e.target.value })} placeholder="Button link" className="flex-1" />
          </div>
        </div>
      );
    case "divider":
      return <p className="text-xs text-muted-foreground">A thin gold rule across the page. Nothing to fill in.</p>;
    default:
      return null;
  }
}

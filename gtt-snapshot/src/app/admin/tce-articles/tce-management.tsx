"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TCE_CATEGORIES, type TceCategory } from "@/lib/tce-data";

interface ArticleDoc {
  slug: string;
  title: string;
  category: TceCategory;
  content: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

interface FormData {
  slug: string;
  title: string;
  category: TceCategory;
  content: string;
  sort_order: number;
}

const CATEGORY_COLORS: Record<TceCategory, string> = {
  "getting-started": "bg-blue-100 text-blue-800 border-blue-300",
  processes: "bg-emerald-100 text-emerald-800 border-emerald-300",
  "client-portal": "bg-purple-100 text-purple-800 border-purple-300",
  "help-faqs": "bg-amber-100 text-amber-800 border-amber-300",
};

const emptyForm: FormData = {
  slug: "",
  title: "",
  category: "getting-started",
  content: "",
  sort_order: 0,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TceManagement() {
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tce-articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSeed = async () => {
    if (!confirm("Seed the TCE articles collection with default data?")) return;
    const res = await fetch("/api/admin/seed-tce", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      alert(`Seeded ${data.count} TCE articles.`);
      fetchData();
    } else {
      alert(data.error);
    }
  };

  const toggleExpand = (slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const openAdd = () => {
    setEditingSlug(null);
    const maxOrder = articles.reduce((max, a) => Math.max(max, a.sort_order), 0);
    setForm({ ...emptyForm, sort_order: maxOrder + 1 });
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (article: ArticleDoc) => {
    setEditingSlug(article.slug);
    setForm({
      slug: article.slug,
      title: article.title,
      category: article.category,
      content: article.content,
      sort_order: article.sort_order,
    });
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }

    const slug = editingSlug || form.slug || slugify(form.title);
    if (!slug) {
      setError("Slug is required");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      slug,
      title: form.title.trim(),
      category: form.category,
      content: form.content,
      sort_order: form.sort_order,
    };

    try {
      const url = editingSlug
        ? `/api/admin/tce-articles/${editingSlug}`
        : "/api/admin/tce-articles";
      const method = editingSlug ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }

      setDialogOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (article: ArticleDoc) => {
    if (!confirm(`Permanently delete "${article.title}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/tce-articles/${article.slug}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const getCategoryLabel = (cat: TceCategory) =>
    TCE_CATEGORIES.find((c) => c.slug === cat)?.label ?? cat;

  const filtered = articles.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          <span>Loading TCE articles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {articles.length} article{articles.length !== 1 && "s"}
        </p>
        <div className="flex gap-2">
          {articles.length === 0 && (
            <Button variant="outline" onClick={handleSeed}>
              Seed Data
            </Button>
          )}
          <Button onClick={openAdd}>Add Article</Button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search articles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Article list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
          heading={search ? "No articles match your search" : "No TCE articles yet"}
          description={search ? "Try a different search term." : "Get started by adding your first article."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => {
            const isExpanded = expandedSlugs.has(article.slug);
            const catColors = CATEGORY_COLORS[article.category];
            return (
              <section key={article.slug} className="border rounded-lg overflow-hidden shadow-[var(--shadow-sm)]">
                <div className="flex items-center bg-gradient-to-r from-[#f0f5f2] to-[#e8f0ec] border-l-4 border-l-[#3a5f54]">
                  <button
                    onClick={() => toggleExpand(article.slug)}
                    className="flex flex-1 items-center justify-between px-4 py-3 hover:from-[#e8f0ec] hover:to-[#dde9e3] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-semibold">{article.title}</h2>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-medium border",
                          catColors
                        )}
                      >
                        {getCategoryLabel(article.category)}
                      </span>
                      <span className="text-xs text-muted-foreground">#{article.sort_order}</span>
                    </div>
                    <span
                      className={cn(
                        "transition-transform duration-200 inline-block text-base text-muted-foreground",
                        isExpanded && "rotate-90"
                      )}
                    >
                      &#x203A;
                    </span>
                  </button>
                  <div className="flex items-center gap-1 pr-3">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(article)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(article)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="p-4">
                      <pre className="whitespace-pre-wrap text-sm bg-muted/50 border rounded-md p-4 max-h-80 overflow-y-auto font-sans leading-relaxed">
                        {article.content}
                      </pre>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSlug ? "Edit Article" : "Add Article"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      title,
                      slug: editingSlug ? prev.slug : slugify(title),
                    }));
                  }}
                  placeholder="e.g. Best Practices"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                  disabled={!!editingSlug}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as TceCategory })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {TCE_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Article content in markdown..."
                rows={16}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

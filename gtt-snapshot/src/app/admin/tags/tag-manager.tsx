"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TAG_CATEGORIES, type TagCategory } from "@/lib/tags";
import type { TagDefinition } from "@/lib/types";

const categoryBadgeColors: Record<TagCategory, string> = {
  "trip-style": "bg-blue-100 text-blue-800 border-blue-300",
  activities: "bg-green-100 text-green-800 border-green-300",
  "traveler-profile": "bg-purple-100 text-purple-800 border-purple-300",
  landscape: "bg-amber-100 text-amber-800 border-amber-300",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface TagManagerProps {
  initialTags: TagDefinition[];
}

export function TagManager({ initialTags }: TagManagerProps) {
  const [tags, setTags] = useState<TagDefinition[]>(initialTags);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState<TagCategory>("trip-style");
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editCategory, setEditCategory] = useState<TagCategory>("trip-style");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const grouped = TAG_CATEGORIES.map((cat) => ({
    ...cat,
    tags: tags.filter((t) => t.category === cat.key),
  }));

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const slug = slugify(label);
    if (tags.some((t) => t.slug === slug)) {
      setError(`A tag with slug "${slug}" already exists.`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, label, category: newCategory }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create tag");
      }
      setTags(
        [...tags, { slug, label, category: newCategory }].sort((a, b) => {
          const catCmp = a.category.localeCompare(b.category);
          if (catCmp !== 0) return catCmp;
          return a.label.localeCompare(b.label);
        })
      );
      setNewLabel("");
      setNewCategory("trip-style");
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (slug: string) => {
    const label = editLabel.trim();
    if (!label) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tags/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, category: editCategory }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update tag");
      }
      setTags(
        tags
          .map((t) =>
            t.slug === slug ? { ...t, label, category: editCategory } : t
          )
          .sort((a, b) => {
            const catCmp = a.category.localeCompare(b.category);
            if (catCmp !== 0) return catCmp;
            return a.label.localeCompare(b.label);
          })
      );
      setEditSlug(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string, label: string) => {
    if (
      !confirm(
        `Delete tag "${label}"? This will also remove it from all destinations that have it.`
      )
    )
      return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tags/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete tag");
      }
      setTags(tags.filter((t) => t.slug !== slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Tags</h1>
          <p className="text-muted-foreground">
            {tags.length} tag{tags.length !== 1 ? "s" : ""} across{" "}
            {TAG_CATEGORIES.length} categories
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
          {!adding && (
            <Button onClick={() => setAdding(true)}>Add Tag</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Add Tag Form */}
      {adding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., River Cruises"
                  autoFocus
                />
                {newLabel.trim() && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Slug: {slugify(newLabel)}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as TagCategory)
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                >
                  {TAG_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleAdd} disabled={saving || !newLabel.trim()}>
                {saving ? "Adding..." : "Add"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAdding(false);
                  setNewLabel("");
                  setError("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags grouped by category */}
      {grouped.map((group) => (
        <Card key={group.key}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{group.label}</CardTitle>
              <Badge
                variant="secondary"
                className={categoryBadgeColors[group.key]}
              >
                {group.tags.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {group.tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags in this category.
              </p>
            ) : (
              <div className="space-y-1">
                {group.tags.map((tag) => (
                  <div
                    key={tag.slug}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group"
                  >
                    {editSlug === tag.slug ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="h-8 text-sm w-48"
                          autoFocus
                        />
                        <select
                          value={editCategory}
                          onChange={(e) =>
                            setEditCategory(e.target.value as TagCategory)
                          }
                          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                        >
                          {TAG_CATEGORIES.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => handleEdit(tag.slug)}
                          disabled={saving}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setEditSlug(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-sm font-medium">
                            {tag.label}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {tag.slug}
                          </span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setEditSlug(tag.slug);
                              setEditLabel(tag.label);
                              setEditCategory(tag.category);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(tag.slug, tag.label)}
                            disabled={saving}
                          >
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

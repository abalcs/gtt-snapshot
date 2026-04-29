"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface EmailTemplate {
  type: string;
  subject?: string | null;
  body: string;
}

interface TemplateDoc {
  id: string;
  destination: string;
  author: string;
  templates: EmailTemplate[];
  created_at: string;
  updated_at: string;
}

interface FormData {
  destination: string;
  author: string;
  templates: EmailTemplate[];
}

const TEMPLATE_TYPES = ["Standard", "Very Soon Departure", "Long-Range Planning"];

const TYPE_COLORS: Record<string, string> = {
  Standard: "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Very Soon Departure": "bg-amber-100 text-amber-800 border-amber-300",
  "Long-Range Planning": "bg-blue-100 text-blue-800 border-blue-300",
};

const emptyForm: FormData = {
  destination: "",
  author: "",
  templates: TEMPLATE_TYPES.map((type) => ({ type, subject: "", body: "" })),
};

export function EmailTemplatesManagement() {
  const [docs, setDocs] = useState<TemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedDest, setExpandedDest] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/email-templates");
      if (res.ok) {
        const data = await res.json();
        setDocs(data.templates);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSeed = async () => {
    if (!confirm("Seed the email templates collection with default data?")) return;
    const res = await fetch("/api/admin/seed-email-templates", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      alert(`Seeded ${data.count} destination template sets.`);
      fetchData();
    } else {
      alert(data.error);
    }
  };

  const toggleDest = (dest: string) => {
    setExpandedDest((prev) => {
      const next = new Set(prev);
      if (next.has(dest)) next.delete(dest);
      else next.add(dest);
      return next;
    });
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setActiveTab(0);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (doc: TemplateDoc) => {
    setEditingId(doc.id);
    const templates = TEMPLATE_TYPES.map((type) => {
      const existing = doc.templates.find((t) => t.type === type);
      return existing
        ? { type, subject: existing.subject ?? "", body: existing.body }
        : { type, subject: "", body: "" };
    });
    setForm({
      destination: doc.destination,
      author: doc.author,
      templates,
    });
    setActiveTab(0);
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.destination.trim()) {
      setError("Destination is required");
      return;
    }

    setSaving(true);
    setError("");

    const templates = form.templates
      .filter((t) => t.body.trim())
      .map((t) => ({
        type: t.type,
        subject: t.subject?.trim() || null,
        body: t.body,
      }));

    const payload = {
      destination: form.destination.trim(),
      author: form.author.trim(),
      templates,
    };

    try {
      const url = editingId
        ? `/api/admin/email-templates/${editingId}`
        : "/api/admin/email-templates";
      const method = editingId ? "PUT" : "POST";

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

  const handleDelete = async (doc: TemplateDoc) => {
    if (!confirm(`Permanently delete templates for "${doc.destination}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/email-templates/${doc.id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const updateTemplate = (index: number, field: "subject" | "body", value: string) => {
    setForm((prev) => {
      const templates = [...prev.templates];
      templates[index] = { ...templates[index], [field]: value };
      return { ...prev, templates };
    });
  };

  const filtered = docs.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.destination.toLowerCase().includes(q) ||
      d.author.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-muted-foreground">Loading email templates...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Email Templates</h1>
          <p className="text-muted-foreground">
            {docs.length} destination{docs.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
          {docs.length === 0 && (
            <Button variant="outline" onClick={handleSeed}>
              Seed Data
            </Button>
          )}
          <Button onClick={openAdd}>Add Destination</Button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by destination or author..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Expandable destination list */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {search ? "No templates match your search" : "No email templates yet"}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((doc) => (
            <section key={doc.id} className="border rounded-lg overflow-hidden shadow-[var(--shadow-sm)]">
              {/* Destination header */}
              <div className="flex items-center bg-gradient-to-r from-[#f0f5f2] to-[#e8f0ec] border-l-4 border-l-[#3a5f54]">
                <button
                  onClick={() => toggleDest(doc.id)}
                  className="flex flex-1 items-center justify-between px-4 py-3 hover:from-[#e8f0ec] hover:to-[#dde9e3] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{doc.destination}</h2>
                    <span className="text-xs text-muted-foreground">by {doc.author || "Unknown"}</span>
                  </div>
                  <span className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span>{doc.templates.length} template{doc.templates.length !== 1 && "s"}</span>
                    <span
                      className={cn(
                        "transition-transform duration-200 inline-block text-base",
                        expandedDest.has(doc.id) && "rotate-90"
                      )}
                    >
                      &#x203A;
                    </span>
                  </span>
                </button>
                <div className="flex items-center gap-1 pr-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(doc)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(doc)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Expandable template content */}
              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                  expandedDest.has(doc.id)
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="p-4 space-y-4">
                    {doc.templates.map((template, idx) => {
                      const key = `${doc.id}-${template.type}`;
                      const isCopied = copiedKey === key;
                      const isSubjectCopied = copiedKey === `${key}-subject`;

                      return (
                        <Card key={idx}>
                          <CardContent className="pt-4 pb-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className={cn("font-semibold", TYPE_COLORS[template.type])}
                              >
                                {template.type}
                              </Badge>
                            </div>

                            {template.subject && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground shrink-0">Subject:</span>
                                <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                                  {template.subject}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(template.subject!, `${key}-subject`)}
                                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors shrink-0"
                                >
                                  {isSubjectCopied ? (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            <div className="relative group">
                              <pre className="whitespace-pre-wrap text-sm bg-muted/50 border rounded-md p-4 max-h-64 overflow-y-auto font-sans leading-relaxed">
                                {template.body}
                              </pre>
                              <button
                                onClick={() => copyToClipboard(template.body, key)}
                                className={cn(
                                  "absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all shadow-sm",
                                  isCopied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-white border text-foreground hover:bg-accent opacity-0 group-hover:opacity-100"
                                )}
                              >
                                {isCopied ? (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                    Copy Body
                                  </>
                                )}
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Email Templates" : "Add Destination Templates"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="e.g. United Kingdom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="e.g. Sarah Ciotti"
                />
              </div>
            </div>

            {/* Template type tabs */}
            <div className="space-y-3">
              <Label>Templates</Label>
              <div className="flex border-b">
                {TEMPLATE_TYPES.map((type, idx) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === idx
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`subject-${activeTab}`}>Subject Line</Label>
                  <Input
                    id={`subject-${activeTab}`}
                    value={form.templates[activeTab]?.subject ?? ""}
                    onChange={(e) => updateTemplate(activeTab, "subject", e.target.value)}
                    placeholder="Email subject line (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`body-${activeTab}`}>Email Body</Label>
                  <Textarea
                    id={`body-${activeTab}`}
                    value={form.templates[activeTab]?.body ?? ""}
                    onChange={(e) => updateTemplate(activeTab, "body", e.target.value)}
                    placeholder="Email body text..."
                    rows={14}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
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

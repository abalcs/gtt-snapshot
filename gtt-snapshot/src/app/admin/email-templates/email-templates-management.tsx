"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const emptyForm: FormData = {
  destination: "",
  author: "",
  templates: TEMPLATE_TYPES.map((type) => ({ type, subject: "", body: "" })),
};

export function EmailTemplatesManagement() {
  const [docs, setDocs] = useState<TemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setActiveTab(0);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (doc: TemplateDoc) => {
    setEditingId(doc.id);
    // Ensure all 3 template types exist in form
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

    // Filter out templates with empty bodies
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

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destination</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Templates</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {search ? "No templates match your search" : "No email templates yet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.destination}</TableCell>
                  <TableCell>{doc.author || "\u2014"}</TableCell>
                  <TableCell>{doc.templates.length} template{doc.templates.length !== 1 && "s"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : "\u2014"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

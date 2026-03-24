"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface ConsultantDoc {
  id: string;
  name: string;
  title: string;
  calendarUrl: string | null;
  destinations: string[];
  displayRegions: string[];
  countriesDisplay: string;
  disabledDestinations: string[];
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  title: string;
  calendarUrl: string;
  destinations: string;
  displayRegions: string;
  countriesDisplay: string;
  disabledDestinations: string[];
}

const emptyForm: FormData = {
  name: "",
  title: "",
  calendarUrl: "",
  destinations: "",
  displayRegions: "",
  countriesDisplay: "",
  disabledDestinations: [],
};

export function ConsultantManagement() {
  const [consultants, setConsultants] = useState<ConsultantDoc[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [consultantsRes, countsRes] = await Promise.all([
        fetch("/api/admin/consultants"),
        fetch("/api/booking-clicks"),
      ]);
      if (consultantsRes.ok) {
        const data = await consultantsRes.json();
        setConsultants(data.consultants);
      }
      if (countsRes.ok) {
        const counts = await countsRes.json();
        setBookingCounts(counts);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSeed = async () => {
    if (!confirm("Seed the consultants collection with default data?")) return;
    const res = await fetch("/api/admin/seed-consultants", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      alert(`Seeded ${data.count} consultants.`);
      fetchData();
    } else {
      alert(data.error);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (c: ConsultantDoc) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      title: c.title,
      calendarUrl: c.calendarUrl || "",
      destinations: c.destinations.join(", "),
      displayRegions: c.displayRegions.join(", "),
      countriesDisplay: c.countriesDisplay,
      disabledDestinations: c.disabledDestinations || [],
    });
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError("");

    const destinationSlugs = form.destinations.split(",").map((s) => s.trim()).filter(Boolean);
    // Remove disabled entries for destinations no longer in the list
    const cleanedDisabled = form.disabledDestinations.filter((d) => destinationSlugs.includes(d));

    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      calendarUrl: form.calendarUrl.trim() || null,
      destinations: destinationSlugs,
      displayRegions: form.displayRegions.split(",").map((s) => s.trim()).filter(Boolean),
      countriesDisplay: form.countriesDisplay.trim(),
      disabledDestinations: cleanedDisabled,
    };

    try {
      const url = editingId
        ? `/api/admin/consultants/${editingId}`
        : "/api/admin/consultants";
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

  const handleToggleStatus = async (c: ConsultantDoc) => {
    const action = c.status === "active" ? "deactivate" : "reactivate";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${c.name}?`)) return;

    const res = await fetch(`/api/admin/consultants/${c.id}`, { method: "PATCH" });
    if (res.ok) fetchData();
  };

  const handleDelete = async (c: ConsultantDoc) => {
    if (!confirm(`Permanently delete ${c.name}? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/consultants/${c.id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const handleBookingAdjust = async (id: string, action: "increment" | "decrement") => {
    const res = await fetch(`/api/admin/consultants/${id}/booking-count`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      // Optimistic update
      setBookingCounts((prev) => ({
        ...prev,
        [id]: Math.max(0, (prev[id] || 0) + (action === "increment" ? 1 : -1)),
      }));
    }
  };

  const filtered = consultants.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.countriesDisplay.toLowerCase().includes(q) ||
      c.displayRegions.some((r) => r.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-muted-foreground">Loading consultants...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Consultants</h1>
          <p className="text-muted-foreground">
            {consultants.length} consultant{consultants.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
          {consultants.length === 0 && (
            <Button variant="outline" onClick={handleSeed}>
              Seed Data
            </Button>
          )}
          <Button onClick={openAdd}>Add Consultant</Button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name, title, region, or country..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Regions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">30d Bookings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {search ? "No consultants match your search" : "No consultants yet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.title || "\u2014"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.displayRegions.map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "default" : "destructive"}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleBookingAdjust(c.id, "decrement")}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {bookingCounts[c.id] || 0}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleBookingAdjust(c.id, "increment")}
                      >
                        +
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(c)}
                      >
                        {c.status === "active" ? "Deactivate" : "Reactivate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(c)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Consultant" : "Add Consultant"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Jane Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Senior, Turbo, CS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calendarUrl">Calendar URL</Label>
              <Input
                id="calendarUrl"
                value={form.calendarUrl}
                onChange={(e) => setForm({ ...form, calendarUrl: e.target.value })}
                placeholder="https://outlook.office365.com/book/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinations">Destinations (comma-separated slugs)</Label>
              <Input
                id="destinations"
                value={form.destinations}
                onChange={(e) => setForm({ ...form, destinations: e.target.value })}
                placeholder="e.g. greece, italy, france"
              />
              {(() => {
                const slugs = form.destinations.split(",").map((s) => s.trim()).filter(Boolean);
                if (slugs.length === 0) return null;
                return (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Destination Toggles (uncheck to temporarily hide)</Label>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {slugs.map((slug) => {
                        const isDisabled = form.disabledDestinations.includes(slug);
                        return (
                          <label key={slug} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!isDisabled}
                              onChange={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  disabledDestinations: isDisabled
                                    ? prev.disabledDestinations.filter((d) => d !== slug)
                                    : [...prev.disabledDestinations, slug],
                                }));
                              }}
                              className="rounded"
                            />
                            <span className={isDisabled ? "line-through text-muted-foreground" : ""}>
                              {slug}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayRegions">Display Regions (comma-separated)</Label>
              <Input
                id="displayRegions"
                value={form.displayRegions}
                onChange={(e) => setForm({ ...form, displayRegions: e.target.value })}
                placeholder="e.g. Greece, Italy"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="countriesDisplay">Countries Display</Label>
              <Input
                id="countriesDisplay"
                value={form.countriesDisplay}
                onChange={(e) => setForm({ ...form, countriesDisplay: e.target.value })}
                placeholder="e.g. Greece, Italy, France"
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

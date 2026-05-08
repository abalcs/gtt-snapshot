"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface FeedbackItem {
  id: string;
  user_name: string;
  user_email: string;
  category: string;
  message: string;
  page_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const categoryLabels: Record<string, string> = {
  "edit-suggestion": "Edit Suggestion",
  "feature-request": "Feature Request",
  general: "General",
};

const categoryColors: Record<string, string> = {
  "edit-suggestion": "bg-blue-100 text-blue-800",
  "feature-request": "bg-purple-100 text-purple-800",
  general: "bg-gray-100 text-gray-800",
};

const statusColors: Record<string, string> = {
  new: "bg-green-100 text-green-800",
  reviewed: "bg-amber-100 text-amber-800",
  archived: "bg-gray-100 text-gray-500",
};

export function FeedbackManagement() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Notes dialog
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesTarget, setNotesTarget] = useState<FeedbackItem | null>(null);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/feedback/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchFeedback();
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    const res = await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
    if (res.ok) fetchFeedback();
  };

  const openNotes = (item: FeedbackItem) => {
    setNotesTarget(item);
    setNotesText(item.admin_notes || "");
    setNotesDialogOpen(true);
  };

  const saveNotes = async () => {
    if (!notesTarget) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/feedback/${notesTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: notesText }),
      });
      if (res.ok) {
        setNotesDialogOpen(false);
        fetchFeedback();
      }
    } finally {
      setSavingNotes(false);
    }
  };

  const filtered = feedback.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (categoryFilter !== "all" && item.category !== categoryFilter)
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback</h1>
          <p className="text-muted-foreground">
            {feedback.length} submission{feedback.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="edit-suggestion">Edit Suggestion</SelectItem>
            <SelectItem value="feature-request">Feature Request</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No feedback found
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : item.id)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      categoryColors[item.category] || ""
                    }`}
                  >
                    {categoryLabels[item.category] || item.category}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusColors[item.status] || ""
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-sm font-medium truncate flex-1">
                    {item.message.length > 80
                      ? item.message.slice(0, 80) + "..."
                      : item.message}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.user_name}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-muted/30 space-y-3">
                    <div className="grid grid-cols-2 gap-4 pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          From
                        </p>
                        <p className="text-sm">
                          {item.user_name} ({item.user_email})
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Page
                        </p>
                        <p className="text-sm truncate">
                          {item.page_url || "\u2014"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Message
                      </p>
                      <p className="text-sm whitespace-pre-wrap bg-white rounded p-3 border">
                        {item.message}
                      </p>
                    </div>

                    {item.admin_notes && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Admin Notes
                        </p>
                        <p className="text-sm whitespace-pre-wrap bg-amber-50 rounded p-3 border border-amber-200">
                          {item.admin_notes}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      {item.status === "new" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(item.id, "reviewed")}
                        >
                          Mark Reviewed
                        </Button>
                      )}
                      {item.status !== "archived" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(item.id, "archived")}
                        >
                          Archive
                        </Button>
                      )}
                      {item.status === "archived" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(item.id, "new")}
                        >
                          Reopen
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openNotes(item)}
                      >
                        {item.admin_notes ? "Edit Notes" : "Add Notes"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteFeedback(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Add notes about this feedback..."
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotesDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveNotes} disabled={savingNotes}>
              {savingNotes ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

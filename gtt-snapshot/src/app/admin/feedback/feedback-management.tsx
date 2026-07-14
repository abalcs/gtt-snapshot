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
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

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

    // Re-fetch when feedback is submitted from the floating button
    const onSubmit = () => fetchFeedback();
    window.addEventListener("feedback-submitted", onSubmit);

    // Poll every 30s for submissions from other users
    const interval = setInterval(fetchFeedback, 30000);

    return () => {
      window.removeEventListener("feedback-submitted", onSubmit);
      clearInterval(interval);
    };
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
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          <span>Loading feedback...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {feedback.length} submission{feedback.length !== 1 ? "s" : ""}
        </p>
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
        <EmptyState
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
          heading="No feedback found"
          description="No submissions match the current filters."
        />
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

                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
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
                  </div>
                </div>
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

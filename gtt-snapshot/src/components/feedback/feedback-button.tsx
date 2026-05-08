"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedbackButtonProps {
  user: { name: string; email: string };
}

export function FeedbackButton({ user }: FeedbackButtonProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("edit-suggestion");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleOpen = () => {
    setCategory("edit-suggestion");
    setMessage("");
    setError("");
    setSubmitted(false);
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          page_url: window.location.origin + pathname,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit feedback");
        return;
      }

      // Temporary: show email debug info
      if (data.emailStatus && data.emailStatus !== "sent_to_1" && data.emailStatus !== "skipped") {
        console.log("Feedback email status:", data.emailStatus);
      }

      setSubmitted(true);
      setTimeout(() => setOpen(false), 2000);
    } catch {
      setError("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/80 text-white shadow-lg transition-all hover:bg-amber-500 hover:scale-110 hover:shadow-xl"
        title="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium">Thanks for your feedback!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">From</Label>
                <p className="text-sm">
                  {user.name} ({user.email})
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="feedback-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="edit-suggestion">
                      Edit Suggestion
                    </SelectItem>
                    <SelectItem value="feature-request">
                      Feature Request
                    </SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="feedback-message">Message</Label>
                <Textarea
                  id="feedback-message"
                  placeholder="Describe your suggestion or feedback..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Page</Label>
                <p className="text-xs text-muted-foreground truncate">
                  {pathname}
                </p>
              </div>
            </div>
          )}

          {!submitted && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Sending..." : "Submit"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

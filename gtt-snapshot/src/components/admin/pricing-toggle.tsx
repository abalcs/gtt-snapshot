"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export function PricingToggle({ initialVisible }: { initialVisible: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(initialVisible);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const newValue = !visible;
    try {
      const res = await fetch("/api/admin/display-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricing_visible: newValue }),
      });
      if (res.ok) {
        setVisible(newValue);
        // Refresh server component data so revisiting this page stays in sync
        router.refresh();
      }
    } catch {
      // silently fail — state stays unchanged
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${visible ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm font-semibold truncate">Pricing</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {visible ? "Visible to all users" : "Hidden from users"}
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${visible ? "bg-green-500" : "bg-muted"}`}
            role="switch"
            aria-checked={visible}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${visible ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

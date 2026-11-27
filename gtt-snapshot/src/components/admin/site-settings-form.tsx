"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SiteSettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<SiteSettings>) => {
    setValues((v) => ({ ...v, ...patch }));
    setSaved(false);
  };

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-sm text-muted-foreground">
          Wording and notices for the whole site. Changes apply as soon as you save — no code, no redeploy.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Saved. The change is live across the site now.
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Home page heading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hero-title">Title</Label>
            <Input
              id="hero-title"
              value={values.hero_title}
              onChange={(e) => set({ hero_title: e.target.value })}
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-subtitle">Subtitle</Label>
            <Textarea
              id="hero-subtitle"
              value={values.hero_subtitle}
              onChange={(e) => set({ hero_subtitle: e.target.value })}
              maxLength={200}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Announcement banner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.announcement_enabled}
              onChange={(e) => set({ announcement_enabled: e.target.checked })}
              className="h-4 w-4 accent-[#0e4d5c]"
            />
            Show a banner at the top of every page
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="announcement-text">Banner text</Label>
            <Input
              id="announcement-text"
              value={values.announcement_text}
              onChange={(e) => set({ announcement_text: e.target.value })}
              placeholder="e.g. New: Finland is now on sale — see the guide"
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="announcement-href">Link (optional)</Label>
            <Input
              id="announcement-href"
              value={values.announcement_href}
              onChange={(e) => set({ announcement_href: e.target.value })}
              placeholder="/p/finland-guide or https://…"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">
              When set, the whole banner becomes a link. Use a site path like /p/your-page or a full web address.
            </p>
          </div>
          {values.announcement_enabled && values.announcement_text && (
            <div className="rounded-lg border border-[#c9a227]/50 bg-[#c9a227]/15 px-4 py-2.5 text-center text-[13px] text-[#22332c]">
              {values.announcement_text}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-[#0e4d5c] hover:bg-[#0d4256]">
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}

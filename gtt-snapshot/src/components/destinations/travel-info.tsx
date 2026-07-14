"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TravelData } from "@/lib/types";

const advisoryColors: Record<number, { bg: string; text: string; dot: string; border: string }> = {
  1: { bg: "bg-green-50", text: "text-green-800", dot: "bg-green-500", border: "border-green-200" },
  2: { bg: "bg-yellow-50", text: "text-yellow-800", dot: "bg-yellow-500", border: "border-yellow-200" },
  3: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500", border: "border-orange-200" },
  4: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", border: "border-red-200" },
};

const advisoryLabels: Record<number, string> = {
  1: "Normal Precautions",
  2: "Increased Caution",
  3: "Reconsider Travel",
  4: "Do Not Travel",
};

function visaLabel(status: string, days: number | null): string {
  const labels: Record<string, string> = {
    "visa free": days ? `Visa Free · ${days}d` : "Visa Free",
    "visa on arrival": days ? `On Arrival · ${days}d` : "On Arrival",
    "e-visa": "eVisa Required",
    "eta": "ETA Required",
    "visa required": "Visa Required",
    "no admission": "No Admission",
  };
  return labels[status] || status;
}

function visaBadgeColor(status: string): string {
  switch (status) {
    case "visa free": return "bg-green-100 text-green-800 border-green-300";
    case "visa on arrival": return "bg-blue-100 text-blue-800 border-blue-300";
    case "e-visa":
    case "eta": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "visa required": return "bg-orange-100 text-orange-800 border-orange-300";
    case "no admission": return "bg-red-100 text-red-800 border-red-300";
    default: return "";
  }
}

function ChevronDown({ expanded, className }: { expanded: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""} ${className ?? ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function TravelInfo({ data }: { data: TravelData | null }) {
  const [entryExpanded, setEntryExpanded] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(false);

  if (!data) return null;

  const hasAdvisory = data.advisory_level !== null;
  const hasVisa = data.visa_status !== null;
  const hasEntryExit = !!data.entry_exit_info;
  const hasHealth = data.health_vaccines_recommended.length > 0 ||
    data.health_vaccines_required.length > 0 ||
    data.health_malaria_info ||
    data.health_notes;

  if (!hasAdvisory && !hasVisa && !hasEntryExit && !hasHealth) return null;

  const advisoryStyle = data.advisory_level ? advisoryColors[data.advisory_level] : null;

  const requiredCount = data.health_vaccines_required.length;
  const recommendedCount = data.health_vaccines_recommended.length;
  const hasMalaria = !!data.health_malaria_info;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Travel Information</h2>

      {/* At-a-Glance Metric Tiles */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Advisory Tile */}
        {hasAdvisory && advisoryStyle && (
          <Card className={`flex-1 ${advisoryStyle.bg} border ${advisoryStyle.border}`}>
            <CardContent className="py-3 px-4">
              <p className={`text-xs ${advisoryStyle.text} opacity-70 font-medium`}>US State Dept Advisory</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-block w-3 h-3 rounded-full ${advisoryStyle.dot} shrink-0`} />
                <span className={`font-bold text-sm ${advisoryStyle.text}`}>
                  Level {data.advisory_level}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${advisoryStyle.text} opacity-80`}>
                {advisoryLabels[data.advisory_level!]}
              </p>
              {data.advisory_link && (
                <a
                  href={data.advisory_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs ${advisoryStyle.text} opacity-60 hover:opacity-100 underline mt-1 inline-block`}
                >
                  Full advisory
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Visa Tile */}
        {hasVisa && (
          <Card className="flex-1 bg-muted/40">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/><path d="M6 12h4"/></svg>
                <span className="text-xs text-muted-foreground">Visa (US)</span>
              </div>
              <div className="mt-1.5">
                <Badge variant="outline" className={`text-xs font-semibold ${visaBadgeColor(data.visa_status!)}`}>
                  {visaLabel(data.visa_status!, data.visa_max_days)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Summary Tile */}
        {hasHealth && (
          <Card className="flex-1 bg-muted/40">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 shrink-0"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <span className="text-xs text-muted-foreground">CDC Health</span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                {(requiredCount > 0 || recommendedCount > 0) && (
                  <p className="text-xs font-medium text-foreground">
                    {requiredCount > 0 && <span className="text-red-700">{requiredCount} required</span>}
                    {requiredCount > 0 && recommendedCount > 0 && ", "}
                    {recommendedCount > 0 && <span className="text-blue-700">{recommendedCount} recommended</span>}
                    {" "}vaccine{requiredCount + recommendedCount !== 1 ? "s" : ""}
                  </p>
                )}
                {hasMalaria && (
                  <p className="text-xs text-orange-700 font-medium">Malaria risk present</p>
                )}
                {!requiredCount && !recommendedCount && !hasMalaria && data.health_notes && (
                  <p className="text-xs text-muted-foreground">See health notes</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Collapsible: Entry & Exit Requirements */}
      {hasEntryExit && (
        <Card>
          <CardContent className="py-0 px-4">
            <button
              onClick={() => setEntryExpanded(!entryExpanded)}
              className="flex items-center justify-between w-full py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span className="font-medium text-sm">Entry & Exit Requirements</span>
              </div>
              <ChevronDown expanded={entryExpanded} />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                entryExpanded
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {data.entry_exit_info}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collapsible: Health Details */}
      {hasHealth && (
        <Card>
          <CardContent className="py-0 px-4">
            <button
              onClick={() => setHealthExpanded(!healthExpanded)}
              className="flex items-center justify-between w-full py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 shrink-0"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <span className="font-medium text-sm">CDC Health Recommendations</span>
              </div>
              <ChevronDown expanded={healthExpanded} />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                healthExpanded
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-3 space-y-2">
                  {data.health_vaccines_required.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-700">CDC Required:</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {data.health_vaccines_required.map(v => (
                          <Badge key={v} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.health_vaccines_recommended.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-700">CDC Recommended:</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {data.health_vaccines_recommended.map(v => (
                          <Badge key={v} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.health_malaria_info && (
                    <div>
                      <p className="text-xs font-medium text-orange-700">Malaria Risk:</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{data.health_malaria_info}</p>
                    </div>
                  )}

                  {data.health_notes && (
                    <p className="text-xs text-muted-foreground">{data.health_notes}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source + Timestamp */}
      <p className="text-xs text-muted-foreground">
        Sources: US State Dept, Passport Index
        {data.health_synced_at && ", CDC Travelers' Health"}
        {" · "}Last updated {new Date(data.synced_at).toLocaleDateString()}
      </p>
    </div>
  );
}

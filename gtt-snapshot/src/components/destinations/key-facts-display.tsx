"use client";

import { Badge } from "@/components/ui/badge";

/**
 * Parses free-form key_facts text into scannable bullets for quick reference
 * during phone calls. Extracts ALL CAPS warnings to the top as alert badges.
 */

// Common abbreviations that shouldn't trigger sentence splits
const ABBREVIATIONS = /(?:U\.S|Dr|Mr|Mrs|Jr|Sr|St|vs|etc|approx|govt|dept|avg|min|max|hrs?|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\./gi;

function splitIntoFacts(text: string): string[] {
  // Replace abbreviation periods with a placeholder to avoid false splits
  let safe = text;
  const abbrevMatches: string[] = [];
  safe = safe.replace(ABBREVIATIONS, (match) => {
    abbrevMatches.push(match);
    return `__ABBREV${abbrevMatches.length - 1}__`;
  });

  // Split on period followed by space and an uppercase letter, or on newlines
  const raw = safe.split(/\.(?=\s+[A-Z])|\n+/);

  return raw
    .map((s) => {
      // Restore abbreviations
      let restored = s;
      for (let i = 0; i < abbrevMatches.length; i++) {
        restored = restored.replace(`__ABBREV${i}__`, abbrevMatches[i]);
      }
      return restored.trim().replace(/\.$/, "").trim();
    })
    .filter((s) => s.length > 0);
}

// Detect ALL CAPS phrases that are warnings/alerts (3+ uppercase chars, allowing spaces between words)
function extractAlerts(facts: string[]): { alerts: string[]; remaining: string[] } {
  const alerts: string[] = [];
  const remaining: string[] = [];

  for (const fact of facts) {
    // Check if the fact starts with an ALL CAPS phrase (at least 2 words or a single emphatic word 4+ chars)
    const capsMatch = fact.match(/^([A-Z][A-Z\s/,\-&]{2,}[A-Z])(?:[.,:\s]|$)/);
    if (capsMatch) {
      const alertText = capsMatch[1].trim();
      const rest = fact.slice(capsMatch[0].length).trim();
      // Only treat as alert if it looks like a warning (short emphatic phrase)
      if (alertText.length <= 60) {
        alerts.push(alertText);
        if (rest.length > 0) {
          remaining.push(rest);
        }
        continue;
      }
    }
    remaining.push(fact);
  }

  return { alerts, remaining };
}

// Render a fact with bolded location/topic names before colons or dashes
function renderFact(fact: string): React.ReactNode {
  // Pattern: "Location Name:" or "Location Name -" at the start
  const colonMatch = fact.match(/^([^:]{3,40}):\s*(.+)$/);
  if (colonMatch) {
    return (
      <>
        <span className="font-semibold text-foreground">{colonMatch[1]}:</span>{" "}
        {colonMatch[2]}
      </>
    );
  }

  // Pattern: "Location Name - description"
  const dashMatch = fact.match(/^([A-Z][^-]{2,35})\s[-–—]\s(.+)$/);
  if (dashMatch) {
    return (
      <>
        <span className="font-semibold text-foreground">{dashMatch[1]}</span>
        {" — "}
        {dashMatch[2]}
      </>
    );
  }

  return fact;
}

export function KeyFactsDisplay({ keyFacts }: { keyFacts: string }) {
  const facts = splitIntoFacts(keyFacts);
  const { alerts, remaining } = extractAlerts(facts);

  return (
    <div className="space-y-3">
      {/* Alert badges at top */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert, i) => (
            <Badge
              key={i}
              variant="destructive"
              className="text-xs font-semibold px-2.5 py-1"
            >
              {alert}
            </Badge>
          ))}
        </div>
      )}

      {/* Bullet list */}
      <ul className="space-y-1.5">
        {remaining.map((fact, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
            <span className="text-muted-foreground mt-1.5 shrink-0 block w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            <span className="text-muted-foreground">{renderFact(fact)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

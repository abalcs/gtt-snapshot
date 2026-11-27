import type { SeasonalityEntry } from "@/lib/types";

const LEVEL_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  peak: { bg: "bg-green-100 dark:bg-green-500/20", text: "text-green-800 dark:text-green-200", label: "Peak" },
  high: { bg: "bg-green-100 dark:bg-green-500/20", text: "text-green-800 dark:text-green-200", label: "High" },
  shoulder: { bg: "bg-yellow-100 dark:bg-yellow-500/20", text: "text-yellow-800 dark:text-yellow-200", label: "Shoulder" },
  low: { bg: "bg-blue-100 dark:bg-blue-500/20", text: "text-blue-800 dark:text-blue-200", label: "Low" },
  "year-round": { bg: "bg-gray-100 dark:bg-gray-500/20", text: "text-gray-800 dark:text-gray-200", label: "Year-round" },
};

function getLevelStyle(level: string) {
  const key = level.toLowerCase().trim();
  return LEVEL_COLORS[key] || { bg: "bg-gray-100", text: "text-gray-800", label: level };
}

export function SeasonalityDisplay({ seasonality }: { seasonality: string | null }) {
  if (!seasonality) return <p className="text-sm text-muted-foreground">No seasonality data.</p>;

  let entries: SeasonalityEntry[];
  try {
    entries = JSON.parse(seasonality);
  } catch {
    // If not valid JSON, display as plain text
    return <p className="text-sm">{seasonality}</p>;
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No seasonality data.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Visual bar */}
      <div className="flex rounded-lg overflow-hidden min-h-8">
        {entries.map((entry, i) => {
          const style = getLevelStyle(entry.level);
          const range = (entry.date_range || "").trim();
          // The bar is a summary: long prose ranges live in the detail rows
          // below and in the tooltip; cramming them into a fixed-height bar
          // clipped the text (South Africa feedback, Nov 2026).
          const showRange = range.length > 0 && range.length <= 16;
          return (
            <div
              key={i}
              className={`flex-1 ${style.bg} flex items-center justify-center text-center text-xs font-medium leading-tight px-1 py-1.5 ${style.text} border-r last:border-r-0 border-white dark:border-white/10`}
              title={`${entry.level}: ${entry.date_range}`}
            >
              {showRange ? `${style.label} · ${range}` : style.label}
            </div>
          );
        })}
      </div>

      {/* Detail rows */}
      <div className="space-y-2">
        {entries.map((entry, i) => {
          const style = getLevelStyle(entry.level);
          return (
            <div key={i} className="flex items-start gap-3">
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
              >
                {style.label}
              </span>
              <div className="text-sm">
                <span className="font-medium">{entry.date_range}</span>
                {entry.description && (
                  <span className="text-muted-foreground"> — {entry.description}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

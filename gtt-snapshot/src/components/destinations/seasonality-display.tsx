import type { SeasonalityEntry } from "@/lib/types";

const LEVEL_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  peak: { bg: "bg-green-100", text: "text-green-800", label: "Peak" },
  high: { bg: "bg-green-100", text: "text-green-800", label: "High" },
  shoulder: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Shoulder" },
  low: { bg: "bg-blue-100", text: "text-blue-800", label: "Low" },
  "year-round": { bg: "bg-gray-100", text: "text-gray-800", label: "Year-round" },
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
      <div className="flex rounded-lg overflow-hidden h-8">
        {entries.map((entry, i) => {
          const style = getLevelStyle(entry.level);
          return (
            <div
              key={i}
              className={`flex-1 ${style.bg} flex items-center justify-center text-xs font-medium ${style.text} border-r last:border-r-0 border-white`}
              title={`${entry.level}: ${entry.date_range}`}
            >
              {entry.date_range}
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

interface MobilityAccessibilityProps {
  terrainDifficulty: number | null;
  wheelchairFriendliness: number | null;
  walkingRequired: number | null;
  altitudeConcern: number | null;
  mobilityNotes: string | null;
}

const TERRAIN_LABELS: Record<number, string> = {
  1: "Easy",
  2: "Moderate",
  3: "Challenging",
  4: "Strenuous",
  5: "Extreme",
};

const WHEELCHAIR_LABELS: Record<number, string> = {
  1: "Very Limited",
  2: "Limited",
  3: "Moderate",
  4: "Good",
  5: "Excellent",
};

const WALKING_LABELS: Record<number, string> = {
  1: "Minimal",
  2: "Light",
  3: "Moderate",
  4: "Significant",
  5: "Extensive",
};

const ALTITUDE_LABELS: Record<number, string> = {
  1: "Sea Level",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Extreme",
};

// Static color classes for Tailwind JIT compatibility
const FILLED_COLORS: Record<number, string> = {
  1: "bg-emerald-500",
  2: "bg-emerald-400",
  3: "bg-yellow-400",
  4: "bg-orange-400",
  5: "bg-red-400",
};

function ScoreBar({ score, labels }: { score: number; labels: Record<number, string> }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <div className="flex gap-0.5 flex-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`h-2 flex-1 rounded-sm ${
                n <= score ? FILLED_COLORS[score] : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground ml-1.5 w-6 text-right">
          {score}/5
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{labels[score]}</p>
    </div>
  );
}

export function MobilityAccessibility({
  terrainDifficulty,
  wheelchairFriendliness,
  walkingRequired,
  altitudeConcern,
  mobilityNotes,
}: MobilityAccessibilityProps) {
  const hasScores =
    terrainDifficulty !== null ||
    wheelchairFriendliness !== null ||
    walkingRequired !== null ||
    altitudeConcern !== null;

  if (!hasScores && !mobilityNotes) return null;

  const categories = [
    { label: "Terrain Difficulty", score: terrainDifficulty, labels: TERRAIN_LABELS },
    { label: "Wheelchair Friendliness", score: wheelchairFriendliness, labels: WHEELCHAIR_LABELS },
    { label: "Walking Required", score: walkingRequired, labels: WALKING_LABELS },
    { label: "Altitude Concern", score: altitudeConcern, labels: ALTITUDE_LABELS },
  ].filter((c) => c.score !== null);

  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div key={cat.label} className="space-y-1">
              <h4 className="text-sm font-medium">{cat.label}</h4>
              <ScoreBar score={cat.score!} labels={cat.labels} />
            </div>
          ))}
        </div>
      )}

      {mobilityNotes && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <p className="text-sm text-amber-800">{mobilityNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

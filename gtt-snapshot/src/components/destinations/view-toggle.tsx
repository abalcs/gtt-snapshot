"use client";

interface ViewToggleProps {
  viewMode: "cards" | "map";
  onToggle: (mode: "cards" | "map") => void;
}

export function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-input overflow-hidden">
      <button
        onClick={() => onToggle("cards")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === "cards"
            ? "bg-[#3a5f54] text-white"
            : "hover:bg-muted"
        }`}
        aria-label="Grid view"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>
        Grid
      </button>
      <button
        onClick={() => onToggle("map")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-l border-input ${
          viewMode === "map"
            ? "bg-[#3a5f54] text-white"
            : "hover:bg-muted"
        }`}
        aria-label="Map view"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>
        Map
      </button>
    </div>
  );
}

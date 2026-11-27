interface ClientTypesProps {
  good: string | null;
  okay: string | null;
  bad: string | null;
}

function splitItems(text: string | null): string[] {
  if (!text) return [];
  // Split on commas and newlines, but never inside parentheses:
  // "Beach lovers (Punta del Este, Jose Ignacio), Foodies" is two items.
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === "\n") && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts
    .map((s) => s.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

export function ClientTypes({ good, okay, bad }: ClientTypesProps) {
  const goodItems = splitItems(good);
  const okayItems = splitItems(okay);
  const badItems = splitItems(bad);

  if (goodItems.length === 0 && okayItems.length === 0 && badItems.length === 0) {
    return <p className="text-sm text-muted-foreground">No client type data.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-500/25 dark:bg-green-500/10">
        <h4 className="text-sm font-semibold text-green-800 mb-2 dark:text-green-300">Good For</h4>
        {goodItems.length > 0 ? (
          <ul className="space-y-1">
            {goodItems.map((item, i) => (
              <li key={i} className="text-sm text-green-700 flex items-start gap-1.5 dark:text-green-200">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-green-600 dark:text-green-400">—</p>
        )}
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-500/25 dark:bg-yellow-500/10">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2 dark:text-yellow-300">Okay For</h4>
        {okayItems.length > 0 ? (
          <ul className="space-y-1">
            {okayItems.map((item, i) => (
              <li key={i} className="text-sm text-yellow-700 flex items-start gap-1.5 dark:text-yellow-200">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-yellow-600 dark:text-yellow-400">—</p>
        )}
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-500/25 dark:bg-red-500/10">
        <h4 className="text-sm font-semibold text-red-800 mb-2 dark:text-red-300">Bad For</h4>
        {badItems.length > 0 ? (
          <ul className="space-y-1">
            {badItems.map((item, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-1.5 dark:text-red-200">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400">—</p>
        )}
      </div>
    </div>
  );
}

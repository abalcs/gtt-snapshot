interface ClientTypesProps {
  good: string | null;
  okay: string | null;
  bad: string | null;
}

function splitItems(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/[,\n]/)
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
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h4 className="text-sm font-semibold text-green-800 mb-2">Good For</h4>
        {goodItems.length > 0 ? (
          <ul className="space-y-1">
            {goodItems.map((item, i) => (
              <li key={i} className="text-sm text-green-700 flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-green-600">—</p>
        )}
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Okay For</h4>
        {okayItems.length > 0 ? (
          <ul className="space-y-1">
            {okayItems.map((item, i) => (
              <li key={i} className="text-sm text-yellow-700 flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-yellow-600">—</p>
        )}
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h4 className="text-sm font-semibold text-red-800 mb-2">Bad For</h4>
        {badItems.length > 0 ? (
          <ul className="space-y-1">
            {badItems.map((item, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-red-600">—</p>
        )}
      </div>
    </div>
  );
}

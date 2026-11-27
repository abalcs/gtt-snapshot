// Shared markdown renderer for page content (special sections and Pages).
// Handles ## / ### headings, - and numbered lists, **bold**, *italic*,
// [links](url), and | pipe | tables with a header row.

export function formatInline(text: string): string {
  return text
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-0.5 text-[#0e4d5c] font-medium underline decoration-[#0e4d5c]/30 underline-offset-2 hover:decoration-[#0e4d5c] transition-colors">$1<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>'
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function isSeparatorRow(line: string): boolean {
  return /^\|?[\s:|-]+\|?$/.test(line.trim()) && line.includes("-");
}

export function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let key = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc pl-5 space-y-1 my-2">
          {currentList.map((item, i) => (
            <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Tables: a run of pipe rows, optionally with a |---| separator after row 1
    if (trimmed.startsWith("|")) {
      flushList();
      const rows: string[][] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        if (!isSeparatorRow(lines[j])) rows.push(splitRow(lines[j]));
        j++;
      }
      i = j - 1;
      if (rows.length > 0) {
        const [head, ...body] = rows;
        elements.push(
          <div key={key++} className="my-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0e4d5c]/5">
                  {head.map((cell, ci) => (
                    <th
                      key={ci}
                      className="px-3 py-2 text-left font-semibold border-b border-border"
                      dangerouslySetInnerHTML={{ __html: formatInline(cell) }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className={ri % 2 ? "bg-muted/40" : undefined}>
                    {head.map((_, ci) => (
                      <td
                        key={ci}
                        className="px-3 py-2 align-top border-b border-border/50"
                        dangerouslySetInnerHTML={{ __html: formatInline(row[ci] ?? "") }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={key++} className="text-base font-semibold mt-4 mb-2">{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={key++} className="text-lg font-semibold mt-6 mb-2">{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(<h1 key={key++} className="text-xl font-bold mt-6 mb-3">{trimmed.slice(2)}</h1>);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      currentList.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      currentList.push(trimmed.replace(/^\d+\.\s/, ""));
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-sm leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
      );
    }
  }
  flushList();

  return <div>{elements}</div>;
}

function formatInline(text: string): string {
  return text
    // Markdown links: [text](url)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#0e4d5c] font-medium underline decoration-[#0e4d5c]/30 underline-offset-2 hover:decoration-[#0e4d5c] transition-colors">$1 ↗</a>'
    )
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic (simple pattern, no lookbehind)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function RichText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: formatInline(text) }}
    />
  );
}

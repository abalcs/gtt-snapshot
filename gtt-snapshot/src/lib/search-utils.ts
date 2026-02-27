import type { Destination } from './types';

/**
 * Generate lowercase search tokens from a destination's searchable fields.
 * Used both at seed time and when creating/updating destinations.
 */
export function generateSearchTokens(dest: Partial<Destination>): string[] {
  const fields = [
    dest.name,
    dest.key_facts,
    dest.urgency,
    dest.accommodations,
    dest.client_types_good,
    dest.client_types_okay,
    dest.client_types_bad,
    dest.general_notes_1,
    dest.general_notes_2,
    dest.pair_with,
    dest.region_name,
  ];

  const tokenSet = new Set<string>();
  for (const field of fields) {
    if (!field) continue;
    const words = field.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/);
    for (const word of words) {
      const trimmed = word.trim();
      if (trimmed.length >= 2) {
        tokenSet.add(trimmed);
      }
    }
  }
  return Array.from(tokenSet);
}

/**
 * Generate a snippet highlighting the matched query in the destination's text fields.
 */
export function generateSnippet(dest: Partial<Destination>, query: string): string {
  const fields = [
    dest.name,
    dest.key_facts,
    dest.urgency,
    dest.accommodations,
    dest.client_types_good,
    dest.client_types_okay,
    dest.client_types_bad,
    dest.general_notes_1,
    dest.general_notes_2,
    dest.pair_with,
  ];

  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(Boolean);

  for (const field of fields) {
    if (!field) continue;
    const lowerField = field.toLowerCase();
    // Check if any query word appears in this field
    if (queryWords.some(w => lowerField.includes(w))) {
      // Find the position of the first match
      let matchPos = field.length;
      for (const w of queryWords) {
        const pos = lowerField.indexOf(w);
        if (pos !== -1 && pos < matchPos) matchPos = pos;
      }
      // Extract a window around the match
      const start = Math.max(0, matchPos - 40);
      const end = Math.min(field.length, matchPos + 100);
      let snippet = field.slice(start, end).trim();
      if (start > 0) snippet = '...' + snippet;
      if (end < field.length) snippet = snippet + '...';
      // Highlight matched words
      for (const w of queryWords) {
        const regex = new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        snippet = snippet.replace(regex, '<mark>$1</mark>');
      }
      return snippet;
    }
  }
  return '';
}

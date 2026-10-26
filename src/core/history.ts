export interface HistoryEntry { id: string; url: string; title: string; spaceId: string; visitedAt: string }
const MAX_HISTORY = 500;

export function recordHistory(entries: HistoryEntry[], visit: Omit<HistoryEntry, 'id'>, id: string): HistoryEntry[] {
  if (!/^https?:\/\//i.test(visit.url) || visit.url.length > 2048) return entries;
  const bounded = { ...visit, title: visit.title.slice(0, 250) };
  const previous = entries[0];
  const elapsed = previous ? Date.parse(visit.visitedAt) - Date.parse(previous.visitedAt) : Infinity;
  if (previous?.url === visit.url && previous.spaceId === visit.spaceId && elapsed >= 0 && elapsed < 30000) {
    return [{ ...previous, title: bounded.title || previous.title, visitedAt: visit.visitedAt }, ...entries.slice(1)];
  }
  return [{ ...bounded, id }, ...entries].slice(0, MAX_HISTORY);
}

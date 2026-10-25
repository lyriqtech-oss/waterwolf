import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { recordHistory, type HistoryEntry } from '../core/history';

interface HistoryState {
  entries: HistoryEntry[];
  addVisit: (url: string, title: string, spaceId: string) => void;
  updateTitle: (url: string, spaceId: string, title: string) => void;
  removeVisit: (id: string) => void;
  clearSpace: (spaceId: string) => void;
}

export const useHistoryStore = create<HistoryState>()(persist(set => ({
  entries: [],
  addVisit: (url, title, spaceId) => set(state => ({ entries: recordHistory(state.entries, { url, title, spaceId, visitedAt: new Date().toISOString() }, crypto.randomUUID()) })),
  updateTitle: (url, spaceId, title) => set(state => {
    const index = state.entries.findIndex(entry => entry.url === url && entry.spaceId === spaceId);
    return index < 0 ? state : { entries: state.entries.map((entry, position) => position === index ? { ...entry, title: title.slice(0, 250) } : entry) };
  }),
  removeVisit: id => set(state => ({ entries: state.entries.filter(entry => entry.id !== id) })),
  clearSpace: spaceId => set(state => ({ entries: state.entries.filter(entry => entry.spaceId !== spaceId) }))
}), { name: 'waterwolf-history-v1', partialize: state => ({ entries: state.entries }) }));

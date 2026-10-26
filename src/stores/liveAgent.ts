import { create } from 'zustand';

export type LiveSource = { number: number; title: string; url: string };
export type LiveLog = { stage: string; message: string; url?: string };
export type LiveMessage = { role: 'user' | 'assistant'; text: string };

interface LiveAgentState {
  runId: string | null;
  sessionId: string | null;
  running: boolean;
  asking: boolean;
  logs: LiveLog[];
  sources: LiveSource[];
  messages: LiveMessage[];
  error: string;
  begin(runId: string, question: string): void;
  progress(log: LiveLog): void;
  complete(sessionId: string, answer: string, sources: LiveSource[]): void;
  fail(message: string): void;
  setAsking(value: boolean): void;
  addMessage(message: LiveMessage): void;
}

export const useLiveAgentStore = create<LiveAgentState>(set => ({
  runId: null, sessionId: null, running: false, asking: false, logs: [], sources: [], messages: [], error: '',
  begin: (runId, question) => set({ runId, sessionId: null, running: true, asking: false, logs: [], sources: [], messages: [{ role: 'user', text: question }], error: '' }),
  progress: log => set(state => ({ logs: [...state.logs, log].slice(-24) })),
  complete: (sessionId, answer, sources) => set(state => ({ sessionId, running: false, sources, messages: [...state.messages, { role: 'assistant', text: answer }] })),
  fail: error => set({ running: false, asking: false, error }),
  setAsking: asking => set({ asking }),
  addMessage: message => set(state => ({ messages: [...state.messages, message] }))
}));

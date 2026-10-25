export interface DesktopTabUpdate {
  tabId: string;
  url?: string;
  title?: string;
  status?: 'ready' | 'loading';
  error?: string;
}

export interface DesktopBrowser {
  aiStatus(): Promise<{ configured: boolean; provider: 'openai' | 'gemini'; model: string }>;
  aiSave(settings: { provider: 'openai' | 'gemini'; key: string; model: string }): Promise<{ configured: boolean; provider: 'openai' | 'gemini'; model: string }>;
  aiTest(): Promise<string>;
  aiRemove(): Promise<{ configured: boolean; provider: 'openai' | 'gemini'; model: string }>;
  aiPreview(tabId: string): Promise<{ url: string; title: string; text: string; truncated: boolean }>;
  aiSummarize(tabId: string, url: string): Promise<string>;
  agentPreview(tabIds: string[]): Promise<{ token: string; pages: { url: string; title: string; characters: number; truncated: boolean }[] }>;
  agentRun(token: string, question: string): Promise<string>;
  navigate(tabId: string, url: string, spaceId: string): Promise<{ ok: boolean }>;
  select(tabId: string | null): Promise<void>;
  layout(bounds: { x: number; y: number; width: number; height: number }): Promise<void>;
  close(tabId: string): Promise<void>;
  back(tabId: string): Promise<boolean>;
  forward(tabId: string): Promise<boolean>;
  reload(tabId: string): Promise<boolean>;
  onTabUpdate(callback: (update: DesktopTabUpdate) => void): () => void;
  onNewWindow(callback: (url: string) => void): () => void;
}

declare global {
  interface Window { waterwolfDesktop?: DesktopBrowser }
}

export const desktopBrowser = () => window.waterwolfDesktop;

export function addressToUrl(input: string): string | null {
  const text = input.trim();
  if (!text || /\s/.test(text)) return null;
  if (/^https?:\/\//i.test(text)) {
    try { return new URL(text).href; } catch { return null; }
  }
  if (/^localhost(?::\d+)?(?:[/?#]|$)/i.test(text)) {
    try { return new URL(`http://${text}`).href; } catch { return null; }
  }
  if (/^(?:[a-z\d-]+\.)+[a-z]{2,}(?:[/:?#]|$)/i.test(text)) {
    try { return new URL(`https://${text}`).href; } catch { return null; }
  }
  return null;
}

export type SearchProvider = 'DuckDuckGo' | 'Google' | 'Bing';

export function searchUrl(query: string, provider: SearchProvider = 'DuckDuckGo'): string {
  const encoded = encodeURIComponent(query.trim());
  if (provider === 'Google') return `https://www.google.com/search?q=${encoded}`;
  if (provider === 'Bing') return `https://www.bing.com/search?q=${encoded}`;
  return `https://duckduckgo.com/?q=${encoded}`;
}

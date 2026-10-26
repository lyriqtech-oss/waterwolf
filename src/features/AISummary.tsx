import { useState } from 'react';
import { desktopBrowser } from '../core/desktop';

export interface PageSnapshot { url: string; title: string; text: string; truncated: boolean }
export function AISummary({ tabId, snapshot, provider, onClose }: { tabId: string; snapshot: PageSnapshot; provider: 'openai' | 'gemini'; onClose: () => void }) {
  const providerLabel = provider === 'gemini' ? 'Google Gemini' : 'OpenAI';
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const send = async () => {
    setBusy(true); setError('');
    try { setSummary(await desktopBrowser()!.aiSummarize(tabId, snapshot.url)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not summarize this page.'); }
    finally { setBusy(false); }
  };
  return <div className="ai-modal-backdrop" role="presentation"><section className="ai-modal" role="dialog" aria-modal="true" aria-label="Summarize page">
    <div className="ai-modal-head"><div><h2>Summarize this page</h2><p>{snapshot.title}</p></div><button className="secondary-button" onClick={onClose}>Close</button></div>
    <p className="subtle-note ai-url">{snapshot.url}</p>
    {!summary ? <><p>Review the text below. Selecting “Send to {providerLabel}” sends this page text to your configured model and may use your API quota or incur a charge.</p><div className="ai-preview">{snapshot.text}</div>{snapshot.truncated && <p className="subtle-note">Showing the first 12,000 characters of the page.</p>}<div className="ai-actions"><button className="primary-button" disabled={busy} onClick={() => void send()}>{busy ? 'Summarizing…' : `Send to ${providerLabel}`}</button><button className="secondary-button" onClick={onClose}>Cancel</button></div></> : <><h3>Summary</h3><div className="ai-result">{summary}</div></>}
    {error && <p role="alert" className="ai-error">{error}</p>}
  </section></div>;
}

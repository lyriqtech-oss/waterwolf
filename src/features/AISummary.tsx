import { useState } from 'react';
import { desktopBrowser } from '../core/desktop';

export interface PageSnapshot { url: string; title: string; text: string; truncated: boolean }
export function AISummary({ tabId, snapshot, onClose }: { tabId: string; snapshot: PageSnapshot; onClose: () => void }) {
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
    {!summary ? <><p>Review the text below. Selecting “Send to OpenAI” sends this page text to your configured model and may use paid API credits.</p><div className="ai-preview">{snapshot.text}</div>{snapshot.truncated && <p className="subtle-note">Showing the first 12,000 characters of the page.</p>}<div className="ai-actions"><button className="primary-button" disabled={busy} onClick={() => void send()}>{busy ? 'Summarizing…' : 'Send to OpenAI'}</button><button className="secondary-button" onClick={onClose}>Cancel</button></div></> : <><h3>Summary</h3><div className="ai-result">{summary}</div></>}
    {error && <p role="alert" className="ai-error">{error}</p>}
  </section></div>;
}
import { useState } from 'react';
import { desktopBrowser } from '../core/desktop';
import { useTabsStore } from '../stores';

type Review = { token: string; pages: { url: string; title: string; characters: number; truncated: boolean }[] };

export function AgentResearch() {
  const allTabs = useTabsStore(state => state.tabs);
  const tabs = allTabs.filter(tab => tab.page === null);
  const [question, setQuestion] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [sources, setSources] = useState<Review['pages']>([]);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const desktop = desktopBrowser();
  const toggle = (id: string) => {
    setReview(null); setAnswer('');
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 3 ? [...current, id] : current);
  };
  const prepare = async () => {
    if (!desktop || question.trim().length < 5 || !selected.length) return;
    setBusy(true); setError(''); setAnswer('');
    try {
      const status = await desktop.aiStatus();
      if (!status.configured) throw new Error('Connect Gemini or OpenAI in Settings → AI first.');
      setProvider(status.provider);
      setReview(await desktop.agentPreview(selected));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not review pages.'); }
    finally { setBusy(false); }
  };
  const run = async () => {
    if (!desktop || !review) return;
    setBusy(true); setError('');
    try { const result = await desktop.agentRun(review.token, question); setSources(review.pages); setAnswer(result); setReview(null); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Research failed.'); setReview(null); }
    finally { setBusy(false); }
  };
  return <section className="agent-research">
    <h2>Research agent</h2>
    <p>Ask a question about up to three open web pages. The agent reads those pages and writes an answer with numbered source references.</p>
    {!desktop && <p role="status">Open the WaterWolf desktop app to run this agent.</p>}
    <label htmlFor="agent-question">Research question</label>
    <textarea id="agent-question" maxLength={1000} value={question} onChange={event => { setQuestion(event.target.value); setReview(null); setAnswer(''); }} placeholder="What do these pages say about…?" />
    <fieldset><legend>Pages to read · choose up to 3</legend>
      {tabs.length ? tabs.map(tab => <label key={tab.id} className="agent-source"><input type="checkbox" checked={selected.includes(tab.id)} disabled={!selected.includes(tab.id) && selected.length >= 3} onChange={() => toggle(tab.id)} /><span><strong>{tab.title}</strong><small>{tab.url}</small></span></label>) : <p>Open a web page in a tab first.</p>}
    </fieldset>
    {!review && !answer && <button className="primary-button" disabled={!desktop || busy || question.trim().length < 5 || !selected.length} onClick={() => void prepare()}>{busy ? 'Reading pages…' : 'Review pages and destination'}</button>}
    {review && <div className="agent-review"><h3>Review before sending</h3><p>The following page text will be sent to {provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}. This may use API quota or incur a charge. The agent can only read these pages and return text.</p><ol>{review.pages.map(page => <li key={page.url}><strong>{page.title}</strong><small>{page.url} · {page.characters.toLocaleString()} characters{page.truncated ? ' · excerpt' : ''}</small></li>)}</ol><button className="primary-button" disabled={busy} onClick={() => void run()}>{busy ? 'Researching…' : 'Approve and run'}</button> <button className="secondary-button" disabled={busy} onClick={() => setReview(null)}>Cancel</button></div>}
    {answer && <div className="agent-answer"><h3>Research result</h3><div className="ai-result">{answer}</div><ol>{sources.map(page => <li key={page.url}><strong>{page.title}</strong><small>{page.url}</small></li>)}</ol><p className="subtle-note">Check important claims on the original pages.</p><button className="secondary-button" onClick={() => { setAnswer(''); setSelected([]); setSources([]); }}>New research</button></div>}
    {error && <p className="ai-error" role="alert">{error}</p>}
  </section>;
}

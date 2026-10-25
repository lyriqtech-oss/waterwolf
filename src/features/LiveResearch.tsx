import { useEffect, useState } from 'react';
import { Bot, Search, Square, ExternalLink, Send } from 'lucide-react';
import { desktopBrowser } from '../core/desktop';
import { useLiveAgentStore } from '../stores/liveAgent';

export function LiveResearch({ onOpenPage }: { onOpenPage: (url: string) => void }) {
  const [query, setQuery] = useState('');
  const [followUp, setFollowUp] = useState('');
  const { runId, sessionId, running, asking, logs, sources, messages, error, begin, complete, fail, setAsking, addMessage } = useLiveAgentStore();
  const desktop = desktopBrowser();
  useEffect(() => {
    if (!desktop) return;
    return desktop.onAgentLiveProgress(update => {
      if (update.runId !== useLiveAgentStore.getState().runId) return;
      useLiveAgentStore.getState().progress({ stage: update.stage, message: update.message, url: update.url });
    });
  }, [desktop]);
  const start = async () => {
    const question = query.trim();
    if (!desktop || question.length < 5 || running) return;
    const id = crypto.randomUUID();
    begin(id, question);
    try {
      const result = await desktop.agentLiveRun(id, question);
      complete(result.sessionId, result.answer, result.sources);
    } catch (failure) { fail(failure instanceof Error ? failure.message : 'Research failed.'); }
  };
  const stop = async () => {
    if (desktop && runId) await desktop.agentLiveCancel(runId);
  };
  const ask = async () => {
    const question = followUp.trim();
    if (!desktop || !sessionId || question.length < 5 || asking) return;
    setFollowUp(''); setAsking(true); addMessage({ role: 'user', text: question });
    try { addMessage({ role: 'assistant', text: await desktop.agentLiveAsk(sessionId, question) }); }
    catch (failure) { fail(failure instanceof Error ? failure.message : 'Could not answer.'); }
    finally { setAsking(false); }
  };
  return <section className="agent-research live-research">
    <div className="live-research-heading"><Search size={20}/><div><h2>Live web research</h2><p>Search the web in WaterWolf, read public sources, and ask follow-up questions.</p></div></div>
    <p className="subtle-note">Starting sends your query to DuckDuckGo. Up to three public HTTPS page excerpts go to your configured AI provider. Each run uses one search and one synthesis request; each follow-up makes another provider request and may incur a charge.</p>
    {!desktop && <p role="status">Open the WaterWolf desktop app to use live research.</p>}
    <label htmlFor="live-query">What should the agent research?</label>
    <div className="live-research-input"><input id="live-query" maxLength={300} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void start(); }} placeholder="Example: What changed in web browser security this year?" disabled={running}/><button className="primary-button" onClick={() => void start()} disabled={!desktop || running || query.trim().length < 5}><Bot size={15}/> {running ? 'Researching…' : 'Start research'}</button></div>
    {running && <button className="secondary-button" onClick={() => void stop()}><Square size={13}/> Stop research</button>}
    {logs.length > 0 && <div className="live-progress" aria-live="polite"><h3>Live progress</h3>{logs.map((log, index) => <div key={`${index}-${log.stage}`} className="live-log"><span className="live-dot"/><div><strong>{log.message}</strong>{log.url && <small>{log.url}</small>}</div></div>)}</div>}
    {sources.length > 0 && <div className="live-sources"><h3>Sources read</h3><p className="subtle-note">Search results are independent web pages. Check the domain and publication date before relying on a claim.</p>{sources.map(source => <button key={source.number} onClick={() => onOpenPage(source.url)}><span>[{source.number}] {source.title}</span><small>{new URL(source.url).hostname} · {source.url}</small><ExternalLink size={14}/></button>)}</div>}
    {messages.length > 1 && <div className="live-conversation"><h3>Conversation</h3>{messages.map((message, index) => <div key={index} className={`live-message ${message.role}`}><strong>{message.role === 'user' ? 'You' : 'WaterWolf'}</strong><p>{message.text}</p></div>)}</div>}
    {sessionId && <div className="live-followup"><label htmlFor="live-followup">Ask about these sources</label><div><input id="live-followup" maxLength={1000} value={followUp} onChange={event => setFollowUp(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void ask(); }} placeholder="What else do these pages say?" disabled={asking}/><button className="primary-button" disabled={asking || followUp.trim().length < 5} onClick={() => void ask()}><Send size={14}/> {asking ? 'Thinking…' : 'Ask'}</button></div></div>}
    {error && <p role="alert" className="ai-error">{error}</p>}
  </section>;
}

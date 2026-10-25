import { useEffect, useState } from 'react';
import { desktopBrowser } from '../core/desktop';

export function AISettings() {
  const desktop = desktopBrowser();
  const [status, setStatus] = useState<{ configured: boolean; model: string } | null>(null);
  const [key, setKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { if (desktop) void desktop.aiStatus().then(value => { setStatus(value); setModel(value.model); }).catch(error => setMessage(String(error))); }, [desktop]);
  const save = async () => {
    if (!desktop) return;
    setBusy(true); setMessage('');
    try { setStatus(await desktop.aiSave({ key, model })); setKey(''); setMessage('Key saved on this device. The provider will be checked on the first summary.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save the key.'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!desktop) return;
    setBusy(true); setMessage('');
    try { setStatus(await desktop.aiRemove()); setMessage('API key removed.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not remove the key.'); }
    finally { setBusy(false); }
  };
  if (!desktop) return <p className="subtle-note">Open the WaterWolf desktop app to connect an AI API.</p>;
  return <div className="ai-config">
    <p>Connect your OpenAI API key to summarize the page you are reading. Each summary request may incur a charge from your provider.</p>
    <div className="settings-row"><span><strong>Status</strong><small>{status?.configured ? `Key saved · ${status.model}` : 'No API key saved'}</small></span><span className="status-pill">{status?.configured ? 'Configured' : 'Not configured'}</span></div>
    <label>Model<input value={model} onChange={event => setModel(event.target.value)} placeholder="gpt-4o-mini" autoComplete="off" /></label>
    <label>API key<input type="password" value={key} onChange={event => setKey(event.target.value)} placeholder="sk-…" autoComplete="new-password" /></label>
    <div className="ai-actions"><button className="primary-button" disabled={busy || !key} onClick={() => void save()}>Save connection</button>{status?.configured && <button className="secondary-button" disabled={busy} onClick={() => void remove()}>Remove key</button>}</div>
    {message && <p role="status" className="subtle-note">{message}</p>}
    <p className="subtle-note">The key is encrypted by your operating system and is never sent to websites. Page text is sent to OpenAI only when you approve a summary.</p>
  </div>;
}

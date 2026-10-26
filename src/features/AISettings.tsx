import { useEffect, useState } from 'react';
import { desktopBrowser } from '../core/desktop';

type Provider = 'openai' | 'gemini';
type ConnectionStatus = { configured: boolean; provider: Provider; model: string };
const defaultModel: Record<Provider, string> = { openai: 'gpt-4o-mini', gemini: 'gemini-2.5-flash' };
const providerName: Record<Provider, string> = { openai: 'OpenAI', gemini: 'Gemini' };

export function AISettings() {
  const desktop = desktopBrowser();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [provider, setProvider] = useState<Provider>('openai');
  const [key, setKey] = useState('');
  const [model, setModel] = useState(defaultModel.openai);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { if (desktop) void desktop.aiStatus().then(value => { setStatus(value); setProvider(value.provider); setModel(value.model); }).catch(error => setMessage(String(error))); }, [desktop]);
  const changeProvider = (value: Provider) => { setProvider(value); setModel(defaultModel[value]); setKey(''); setMessage(''); };
  const save = async () => {
    if (!desktop) return;
    setBusy(true); setMessage('');
    try { setStatus(await desktop.aiSave({ provider, key, model })); setKey(''); setMessage('Key saved on this device. Use “Test connection” to check the provider.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save the key.'); }
    finally { setBusy(false); }
  };
  const test = async () => {
    if (!desktop) return;
    setBusy(true); setMessage('');
    try { await desktop.aiTest(); setMessage(`${providerName[status?.provider || provider]} connection works.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Connection test failed.'); }
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
    <p>Connect your own API key to summarize the page you are reading. Each request may use your provider's API quota or incur a charge.</p>
    <div className="settings-row"><span><strong>Status</strong><small>{status?.configured ? `${providerName[status.provider]} key saved · ${status.model}` : 'No API key saved'}</small></span><span className="status-pill">{status?.configured ? 'Configured' : 'Not configured'}</span></div>
    <label>Provider<select value={provider} onChange={event => changeProvider(event.target.value as Provider)}><option value="gemini">Google Gemini</option><option value="openai">OpenAI</option></select></label>
    <label>Model<input value={model} onChange={event => setModel(event.target.value)} placeholder={defaultModel[provider]} autoComplete="off" /></label>
    <label>API key<input type="password" value={key} onChange={event => setKey(event.target.value)} placeholder="Paste your API key" autoComplete="new-password" /></label>
    <div className="ai-actions"><button className="primary-button" disabled={busy || !key} onClick={() => void save()}>Save connection</button>{status?.configured && <><button className="secondary-button" disabled={busy} onClick={() => void test()}>Test connection</button><button className="secondary-button" disabled={busy} onClick={() => void remove()}>Remove key</button></>}</div>
    {message && <p role="status" className="subtle-note">{message}</p>}
    <p className="subtle-note">The key is encrypted on this device and is never sent to websites. Page text is sent to the selected provider only after you review and approve a summary.</p>
  </div>;
}
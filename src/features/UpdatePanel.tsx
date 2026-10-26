import { useEffect, useState } from 'react';
import { Download, RotateCw } from 'lucide-react';
import { desktopBrowser, type UpdateState } from '../core/desktop';

export function UpdatePanel() {
  const desktop = desktopBrowser();
  const [state, setState] = useState<UpdateState | null>(null);
  useEffect(() => {
    if (!desktop) return;
    const unsubscribe = desktop.onUpdateState(setState);
    void desktop.updateStatus().then(current => {
      setState(current);
      if (current.status === 'idle' || current.status === 'current' || current.status === 'error') void desktop.updateCheck().then(setState);
    });
    return unsubscribe;
  }, [desktop]);
  const busy = state?.status === 'checking' || state?.status === 'downloading';
  return <section className="update-panel" aria-label="WaterWolf updates">
    <h2>Updates</h2>
    <p>{state?.message || 'Update checks are available in the installed Windows app.'}</p>
    {state && <p className="update-version">Installed version: {state.currentVersion}{state.availableVersion ? ` · New version: ${state.availableVersion}` : ''}</p>}
    {state?.status === 'downloading' && <progress max={100} value={state.progress} aria-label="Update download progress" />}
    {desktop && state?.status !== 'unavailable' && <div className="update-actions">
      <button className="secondary-button" disabled={busy} onClick={() => void desktop.updateCheck().then(setState)}><RotateCw size={14}/> Check now</button>
      {state?.status === 'available' && <button className="primary-button" onClick={() => void desktop.updateDownload().then(setState)}><Download size={14}/> Download update</button>}
      {state?.status === 'ready' && <button className="primary-button" onClick={() => void desktop.updateInstall()}>Restart and install</button>}
    </div>}
    <small>WaterWolf checks for new versions automatically. Download and installation require your click. Updates are available through GitHub Releases for the installed Windows edition.</small>
  </section>;
}

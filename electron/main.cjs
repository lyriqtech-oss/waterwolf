const path = require('node:path');
const { app, BrowserWindow, WebContentsView, ipcMain, session } = require('electron');
const ai = require('./ai.cjs');
const { externalUrl, createSecurityState } = require('./security.cjs');

let window;
let activeTabId = null;
let contentBounds = { x: 0, y: 89, width: 0, height: 0 };
const views = new Map();
const pendingSummaries = new Map();
const pendingResearch = new Map();
const protectedSessions = new Set();
const security = createSecurityState();
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/;

function requireShell(event) {
  if (!window || event.sender !== window.webContents) throw new Error('Unauthorized sender');
}

function tabId(value) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error('Invalid tab');
  return value;
}

function emit(tab, patch) {
  if (!window || window.isDestroyed()) return;
  window.webContents.send('waterwolf:tab-update', { tabId: tab.id, ...patch });
}

function securityNotice(message) {
  if (window && !window.isDestroyed()) window.webContents.send('waterwolf:security-event', message);
}

function protectSession(webSession) {
  if (protectedSessions.has(webSession)) return;
  protectedSessions.add(webSession);
  webSession.setPermissionRequestHandler((_contents, _permission, callback) => {
    security.record('permissions');
    callback(false);
  });
  webSession.setPermissionCheckHandler(() => false);
  webSession.on('will-download', event => {
    security.record('downloads');
    event.preventDefault();
    securityNotice('Download blocked. File scanning and safe downloads are not available yet.');
  });
}

function showActiveView() {
  if (!window || window.isDestroyed()) return;
  for (const tab of views.values()) window.contentView.removeChildView(tab.view);
  const tab = activeTabId ? views.get(activeTabId) : null;
  if (!tab || contentBounds.width < 1 || contentBounds.height < 1) return;
  tab.view.setBounds(contentBounds);
  window.contentView.addChildView(tab.view);
}

function makeView(id, spaceId) {
  const safeSpace = typeof spaceId === 'string' && ID_PATTERN.test(spaceId) ? spaceId : 'personal';
  const partition = `persist:waterwolf-space-${safeSpace}`;
  const webSession = session.fromPartition(partition);
  protectSession(webSession);
  const view = new WebContentsView({ webPreferences: {
    sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true,
    webviewTag: false, allowRunningInsecureContent: false, partition
  } });
  const tab = { id, view };
  const contents = view.webContents;
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.setWindowOpenHandler(({ url }) => {
    try { window?.webContents.send('waterwolf:new-window', externalUrl(url)); }
    catch { security.record('navigation'); securityNotice('Blocked a popup with an unsafe address.'); }
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    try { externalUrl(url); } catch { event.preventDefault(); security.record('navigation'); securityNotice('Blocked navigation to an unsafe address.'); }
  });
  contents.on('will-redirect', event => {
    if (!event.isMainFrame) return;
    try { externalUrl(event.url); } catch { event.preventDefault(); security.record('navigation'); securityNotice('Blocked an unsafe redirect.'); }
  });
  contents.on('did-navigate', (_event, url) => { pendingSummaries.delete(id); emit(tab, { url }); });
  contents.on('did-navigate-in-page', (_event, url, isMainFrame) => { if (isMainFrame) emit(tab, { url }); });
  contents.on('page-title-updated', (_event, title) => emit(tab, { title: title.slice(0, 250) }));
  contents.on('did-start-loading', () => emit(tab, { status: 'loading' }));
  contents.on('did-stop-loading', () => emit(tab, { status: 'ready' }));
  contents.on('did-fail-load', (_event, errorCode, errorDescription, _url, isMainFrame) => {
    if (isMainFrame && errorCode !== -3) emit(tab, { status: 'ready', error: errorDescription });
  });
  views.set(id, tab);
  if (activeTabId === id) showActiveView();
  return tab;
}

function registerHandlers() {
  ipcMain.handle('waterwolf:security-status', event => { requireShell(event); return security.status(); });
  ipcMain.handle('waterwolf:ai-status', event => { requireShell(event); return ai.status(); });
  ipcMain.handle('waterwolf:ai-save', (event, settings) => { requireShell(event); return ai.save(settings); });
  ipcMain.handle('waterwolf:ai-test', event => { requireShell(event); return ai.testConnection(); });
  ipcMain.handle('waterwolf:ai-remove', event => { requireShell(event); return ai.remove(); });
  ipcMain.handle('waterwolf:ai-preview', async (event, rawId) => {
    requireShell(event);
    const id = tabId(rawId);
    const snapshot = await ai.preview(views.get(id)?.view.webContents);
    pendingSummaries.set(id, { snapshot, createdAt: Date.now() });
    return snapshot;
  });
  ipcMain.handle('waterwolf:ai-summarize', async (event, rawId, expectedUrl) => {
    requireShell(event);
    const id = tabId(rawId);
    if (typeof expectedUrl !== 'string' || expectedUrl.length > 8192) throw new Error('Invalid page');
    const pending = pendingSummaries.get(id);
    pendingSummaries.delete(id);
    const contents = views.get(id)?.view.webContents;
    if (!pending || Date.now() - pending.createdAt > 300000 || !contents || contents.isDestroyed() || pending.snapshot.url !== expectedUrl || contents.getURL() !== expectedUrl) {
      throw new Error('The page changed or the review expired. Review it again before sending.');
    }
    return ai.summarize(pending.snapshot);
  });
  ipcMain.handle('waterwolf:agent-preview', async (event, rawIds) => {
    requireShell(event);
    const providerStatus = await ai.status();
    if (!providerStatus.configured) throw new Error('Connect an AI provider in Settings first.');
    if (!Array.isArray(rawIds) || rawIds.length < 1 || rawIds.length > 3) throw new Error('Choose 1–3 open tabs.');
    const ids = rawIds.map(tabId);
    if (new Set(ids).size !== ids.length) throw new Error('Choose different tabs.');
    const snapshots = await Promise.all(ids.map(id => ai.preview(views.get(id)?.view.webContents)));
    const token = require('node:crypto').randomUUID();
    pendingResearch.clear();
    pendingResearch.set(token, { ids, snapshots, provider: providerStatus.provider, createdAt: Date.now() });
    return { token, pages: snapshots.map(({ url, title, text, truncated }) => ({ url, title, characters: text.length, truncated })) };
  });
  ipcMain.handle('waterwolf:agent-run', async (event, token, question) => {
    requireShell(event);
    if (typeof token !== 'string' || token.length > 100) throw new Error('Invalid review');
    const pending = pendingResearch.get(token);
    pendingResearch.delete(token);
    if (!pending || Date.now() - pending.createdAt > 300000) throw new Error('Review expired. Review the pages again.');
    if ((await ai.status()).provider !== pending.provider) throw new Error('The AI provider changed. Review the pages again.');
    for (let index = 0; index < pending.ids.length; index++) {
      const contents = views.get(pending.ids[index])?.view.webContents;
      if (!contents || contents.isDestroyed() || contents.getURL() !== pending.snapshots[index].url) throw new Error('A page changed. Review the pages again.');
    }
    return ai.research(question, pending.snapshots);
  });
  ipcMain.handle('waterwolf:navigate', async (event, rawId, rawUrl, spaceId) => {
    requireShell(event);
    const id = tabId(rawId);
    const url = externalUrl(rawUrl);
    const tab = views.get(id) ?? makeView(id, spaceId);
    try {
      await tab.view.webContents.loadURL(url);
      return { ok: true };
    } catch (error) {
      emit(tab, { status: 'ready', error: error instanceof Error ? error.message : 'Page could not be loaded' });
      return { ok: false };
    }
  });
  ipcMain.handle('waterwolf:select', (event, rawId) => {
    requireShell(event);
    activeTabId = rawId === null ? null : tabId(rawId);
    showActiveView();
  });
  ipcMain.handle('waterwolf:layout', (event, rawBounds) => {
    requireShell(event);
    const [width, height] = window.getContentSize();
    const source = rawBounds && typeof rawBounds === 'object' ? rawBounds : {};
    const x = Math.max(0, Math.min(width, Math.round(Number(source.x) || 0)));
    const y = Math.max(0, Math.min(height, Math.round(Number(source.y) || 0)));
    contentBounds = {
      x, y,
      width: Math.max(0, Math.min(width - x, Math.round(Number(source.width) || 0))),
      height: Math.max(0, Math.min(height - y, Math.round(Number(source.height) || 0)))
    };
    showActiveView();
  });
  ipcMain.handle('waterwolf:close', (event, rawId) => {
    requireShell(event);
    const id = tabId(rawId);
    const tab = views.get(id);
    if (!tab) return;
    window.contentView.removeChildView(tab.view);
    tab.view.webContents.close();
    views.delete(id);
    pendingSummaries.delete(id);
    if (activeTabId === id) activeTabId = null;
  });
  for (const action of ['back', 'forward', 'reload']) {
    ipcMain.handle(`waterwolf:${action}`, (event, rawId) => {
      requireShell(event);
      const contents = views.get(tabId(rawId))?.view.webContents;
      if (!contents || contents.isDestroyed()) return false;
      if (action === 'reload') contents.reload();
      if (action === 'back' && contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
      if (action === 'forward' && contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward();
      return true;
    });
  }
}

app.whenReady().then(async () => {
  protectSession(session.defaultSession);
  registerHandlers();
  window = new BrowserWindow({
    width: 1500, height: 920, minWidth: 860, minHeight: 600,
    title: 'WaterWolf Browser', backgroundColor: '#F7F9FC',
    icon: path.join(__dirname, '..', 'public', 'waterwolf-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true
    }
  });
  window.on('closed', () => {
    for (const tab of views.values()) if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close();
    views.clear();
    window = null;
  });
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const devUrl = process.env.WATERWOLF_DEV_URL;
  if (devUrl && /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(devUrl)) await window.loadURL(devUrl);
  else await window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.on('window-all-closed', () => app.quit());

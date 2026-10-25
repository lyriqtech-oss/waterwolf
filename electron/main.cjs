const path = require('node:path');
const { app, BrowserWindow, WebContentsView, ipcMain, session } = require('electron');

let window;
let activeTabId = null;
let contentBounds = { x: 0, y: 89, width: 0, height: 0 };
const views = new Map();
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/;

function requireShell(event) {
  if (!window || event.sender !== window.webContents) throw new Error('Unauthorized sender');
}

function externalUrl(value) {
  if (typeof value !== 'string' || value.length > 8192) throw new Error('Invalid address');
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only HTTP and HTTPS pages can be opened');
  return url.href;
}

function tabId(value) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error('Invalid tab');
  return value;
}

function emit(tab, patch) {
  if (!window || window.isDestroyed()) return;
  window.webContents.send('waterwolf:tab-update', { tabId: tab.id, ...patch });
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
  webSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  const view = new WebContentsView({ webPreferences: {
    sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true,
    partition
  } });
  const tab = { id, view };
  const contents = view.webContents;
  contents.setWindowOpenHandler(({ url }) => {
    try { window?.webContents.send('waterwolf:new-window', externalUrl(url)); } catch { /* Unsupported schemes stay blocked. */ }
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    try { externalUrl(url); } catch { event.preventDefault(); }
  });
  contents.on('did-navigate', (_event, url) => emit(tab, { url }));
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
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  registerHandlers();
  window = new BrowserWindow({
    width: 1500, height: 920, minWidth: 860, minHeight: 600,
    title: 'WaterWolf Browser', backgroundColor: '#F7F9FC',
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

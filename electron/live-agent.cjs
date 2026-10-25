const { randomUUID } = require('node:crypto');
const { WebContentsView, session } = require('electron');
const { publicResearchUrl } = require('./security.cjs');
const ai = require('./ai.cjs');

const SEARCH_SCRIPT = `Array.from(document.querySelectorAll('a.result__a, a[data-testid="result-title-a"], article h2 a')).slice(0,12).map(a=>({title:(a.innerText||a.textContent||'').trim().slice(0,250),url:a.href}))`;
const MAX_SOURCES = 3;
const SESSION_MS = 30 * 60 * 1000;

function createLiveAgent({ protectSession, emit }) {
  const conversations = new Map();
  let active = null;
  let networkFilterInstalled = false;

  function progress(runId, stage, message, extra = {}) { emit({ runId, stage, message, ...extra }); }
  function ensureActive(run) { if (run.cancelled) throw new Error('Research stopped.'); }

  async function load(contents, url, run) {
    ensureActive(run);
    let timer;
    try {
      await Promise.race([
        contents.loadURL(url),
        new Promise((_, reject) => { timer = setTimeout(() => { contents.stop(); reject(new Error('Page timed out.')); }, 20000); })
      ]);
      ensureActive(run);
    } finally { clearTimeout(timer); }
  }

  async function run(runId, question) {
    if (typeof runId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(runId)) throw new Error('Invalid run');
    if (typeof question !== 'string' || question.trim().length < 5 || question.length > 300) throw new Error('Enter a research request (5–300 characters).');
    if (active) throw new Error('Another live research is already running.');
    if (!(await ai.status()).configured) throw new Error('Connect Gemini or OpenAI in Settings → AI first.');

    const partition = 'waterwolf-agent-temporary';
    const webSession = session.fromPartition(partition);
    protectSession(webSession);
    await webSession.clearStorageData();
    if (!networkFilterInstalled) {
      networkFilterInstalled = true;
      webSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
        try { publicResearchUrl(details.url); callback({ cancel: false }); }
        catch { callback({ cancel: true }); }
      });
    }
    const view = new WebContentsView({ webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true, webviewTag: false, partition } });
    const contents = view.webContents;
    const current = { runId, cancelled: false, contents, controller: new AbortController() };
    active = current;
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    contents.on('will-navigate', (event, url) => { try { publicResearchUrl(url); } catch { event.preventDefault(); } });
    contents.on('will-redirect', event => { if (event.isMainFrame) try { publicResearchUrl(event.url); } catch { event.preventDefault(); } });
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(question.trim())}`;
      progress(runId, 'search', 'Searching DuckDuckGo in Chromium…', { url: searchUrl });
      await load(contents, searchUrl, current);
      const rawLinks = await contents.executeJavaScript(SEARCH_SCRIPT);
      const links = [];
      for (const item of Array.isArray(rawLinks) ? rawLinks : []) {
        try {
          const url = publicResearchUrl(item.url);
          const host = new URL(url).hostname;
          if (host.endsWith('duckduckgo.com') || links.some(link => link.url === url)) continue;
          links.push({ url, title: String(item.title || host).slice(0, 250) });
        } catch { /* Ignore unsupported or private result links. */ }
        if (links.length >= 6) break;
      }
      if (!links.length) throw new Error('DuckDuckGo returned no readable public results. Try another query.');
      progress(runId, 'results', `Found ${links.length} public results. Reading up to ${MAX_SOURCES} pages…`, { results: links });
      const snapshots = [];
      const readUrls = new Set();
      for (const link of links) {
        ensureActive(current);
        progress(runId, 'reading', `Reading ${link.title}…`, { url: link.url, sourceIndex: snapshots.length + 1 });
        try {
          await load(contents, link.url, current);
          const finalUrl = publicResearchUrl(contents.getURL());
          if (finalUrl !== contents.getURL()) throw new Error('Unexpected redirect');
          const dedupeUrl = new URL(finalUrl);
          dedupeUrl.hash = '';
          if (readUrls.has(dedupeUrl.href)) throw new Error('Same page already read');
          const snapshot = await ai.preview(contents);
          if (snapshot.text.length < 120) throw new Error('Page has too little readable text');
          readUrls.add(dedupeUrl.href);
          snapshots.push(snapshot);
          progress(runId, 'source', `Read source ${snapshots.length}: ${snapshot.title}`, { url: snapshot.url, title: snapshot.title, sourceIndex: snapshots.length });
        } catch (error) {
          ensureActive(current);
          progress(runId, 'skip', `Skipped ${link.title}: ${error instanceof Error ? error.message : 'unavailable'}`, { url: link.url });
        }
        if (snapshots.length >= MAX_SOURCES) break;
      }
      if (!snapshots.length) throw new Error('No readable pages were available from the search results.');
      progress(runId, 'synthesis', `Summarizing ${snapshots.length} sources with your AI provider…`);
      const answer = await ai.research(question, snapshots, current.controller.signal);
      ensureActive(current);
      const sessionId = randomUUID();
      for (const [id, conversation] of conversations) if (Date.now() - conversation.createdAt > SESSION_MS) conversations.delete(id);
      conversations.set(sessionId, { snapshots, messages: [{ role: 'user', text: question.trim() }, { role: 'assistant', text: answer }], createdAt: Date.now() });
      const sources = snapshots.map(({ title, url }, index) => ({ number: index + 1, title, url }));
      progress(runId, 'done', 'Research complete.', { sources });
      return { sessionId, answer, sources };
    } catch (error) {
      progress(runId, current.cancelled ? 'cancelled' : 'error', error instanceof Error ? error.message : 'Research failed.');
      throw error;
    } finally {
      active = null;
      if (!contents.isDestroyed()) contents.close();
    }
  }

  function cancel(runId) {
    if (!active || active.runId !== runId) return false;
    active.cancelled = true;
    active.controller.abort();
    if (!active.contents.isDestroyed()) active.contents.stop();
    return true;
  }

  async function ask(sessionId, question) {
    if (typeof sessionId !== 'string' || sessionId.length > 100) throw new Error('Invalid research session');
    const conversation = conversations.get(sessionId);
    if (!conversation || Date.now() - conversation.createdAt > SESSION_MS) throw new Error('Research session expired. Start a new search.');
    if (conversation.messages.length >= 12) throw new Error('Conversation limit reached. Start a new search.');
    const answer = await ai.followUp(question, conversation.snapshots, conversation.messages);
    conversation.messages.push({ role: 'user', text: question.trim() }, { role: 'assistant', text: answer });
    return answer;
  }

  return { run, cancel, ask };
}

module.exports = { createLiveAgent };

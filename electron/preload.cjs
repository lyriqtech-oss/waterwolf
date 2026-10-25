const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('waterwolfDesktop', {
  navigate: (tabId, url, spaceId) => ipcRenderer.invoke('waterwolf:navigate', tabId, url, spaceId),
  select: tabId => ipcRenderer.invoke('waterwolf:select', tabId),
  layout: bounds => ipcRenderer.invoke('waterwolf:layout', bounds),
  close: tabId => ipcRenderer.invoke('waterwolf:close', tabId),
  back: tabId => ipcRenderer.invoke('waterwolf:back', tabId),
  forward: tabId => ipcRenderer.invoke('waterwolf:forward', tabId),
  reload: tabId => ipcRenderer.invoke('waterwolf:reload', tabId),
  aiStatus: () => ipcRenderer.invoke('waterwolf:ai-status'),
  aiSave: settings => ipcRenderer.invoke('waterwolf:ai-save', settings),
  aiTest: () => ipcRenderer.invoke('waterwolf:ai-test'),
  aiRemove: () => ipcRenderer.invoke('waterwolf:ai-remove'),
  aiPreview: tabId => ipcRenderer.invoke('waterwolf:ai-preview', tabId),
  aiSummarize: (tabId, url) => ipcRenderer.invoke('waterwolf:ai-summarize', tabId, url),
  agentPreview: tabIds => ipcRenderer.invoke('waterwolf:agent-preview', tabIds),
  agentRun: (token, question) => ipcRenderer.invoke('waterwolf:agent-run', token, question),
  agentLiveRun: (runId, question) => ipcRenderer.invoke('waterwolf:agent-live-run', runId, question),
  agentLiveCancel: runId => ipcRenderer.invoke('waterwolf:agent-live-cancel', runId),
  agentLiveAsk: (sessionId, question) => ipcRenderer.invoke('waterwolf:agent-live-ask', sessionId, question),
  onAgentLiveProgress: callback => {
    const listener = (_event, update) => callback(update);
    ipcRenderer.on('waterwolf:agent-live-progress', listener);
    return () => ipcRenderer.removeListener('waterwolf:agent-live-progress', listener);
  },
  securityStatus: () => ipcRenderer.invoke('waterwolf:security-status'),
  onSecurityEvent: callback => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on('waterwolf:security-event', listener);
    return () => ipcRenderer.removeListener('waterwolf:security-event', listener);
  },
  onTabUpdate: callback => {
    const listener = (_event, update) => callback(update);
    ipcRenderer.on('waterwolf:tab-update', listener);
    return () => ipcRenderer.removeListener('waterwolf:tab-update', listener);
  },
  onNewWindow: callback => {
    const listener = (_event, url) => callback(url);
    ipcRenderer.on('waterwolf:new-window', listener);
    return () => ipcRenderer.removeListener('waterwolf:new-window', listener);
  }
});

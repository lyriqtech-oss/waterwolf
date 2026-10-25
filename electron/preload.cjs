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

const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  backupNow: () => ipcRenderer.invoke('backup-now'),
  restoreDb: () => ipcRenderer.invoke('restore-db'),
  minimizeApp: () => ipcRenderer.invoke('minimize-app'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  toggleMaximize: () => ipcRenderer.invoke('toggle-maximize'),
});
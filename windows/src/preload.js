// Puente mínimo y tipado hacia el proceso principal. No expone Node ni ipcRenderer completo.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('paDesktop', {
  secure: {
    get: () => ipcRenderer.invoke('pa:secure:get'),
    set: (v) => ipcRenderer.invoke('pa:secure:set', v),
    clear: () => ipcRenderer.invoke('pa:secure:clear'),
  },
  openExternal: (url) => ipcRenderer.invoke('pa:openExternal', url),
  copyText: (t) => ipcRenderer.invoke('pa:copyText', t),
  saveFile: (name, bytes) => ipcRenderer.invoke('pa:saveFile', name, bytes),
  windowInfo: () => ipcRenderer.invoke('pa:windowInfo'),
});

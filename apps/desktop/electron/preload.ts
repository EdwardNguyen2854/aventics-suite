import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("aventics", {
  request: (path: string, method = "GET", body?: unknown) => ipcRenderer.invoke("suite:request", { path, method, body }),
  openDocs: (componentId: string) => ipcRenderer.invoke("suite:openDocs", componentId),
  readSuiteDoc: (relativePath: string) => ipcRenderer.invoke("suite:readDoc", relativePath),
  version: () => ipcRenderer.invoke("suite:version"),
  mode: () => ipcRenderer.invoke("suite:mode"),
  checkUpdates: () => ipcRenderer.invoke("suite:updateCheck")
});

import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  platform: process.platform,
  ping: (): Promise<string> => ipcRenderer.invoke('ping'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

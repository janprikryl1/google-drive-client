import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  platform: process.platform,
  ping: (): Promise<string> => ipcRenderer.invoke('ping'),
  startWatcher: (folderPath?: string): Promise<{ success: boolean; folderPath: string }> =>
    ipcRenderer.invoke('start-watcher', folderPath),
  stopWatcher: (): Promise<boolean> => ipcRenderer.invoke('stop-watcher'),
  getWatchStatus: (): Promise<{ isWatching: boolean; folderPath: string }> =>
    ipcRenderer.invoke('get-watch-status'),
  selectWatchFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('select-watch-folder'),
  saveFileToSyncFolder: (filename: string, arrayBuffer: ArrayBuffer): Promise<{ success: boolean; path: string }> =>
    ipcRenderer.invoke('save-file-to-sync', { filename, arrayBuffer }),
  deleteFileFromSyncFolder: (filename: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('delete-file-from-sync', filename),
  renameFileInSyncFolder: (oldFilename: string, newFilename: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('rename-file-in-sync', { oldFilename, newFilename }),
  onLocalFileChange: (callback: (data: { filename: string; base64Data: string; mimeType: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('local-file-change', handler);
    return () => {
      ipcRenderer.removeListener('local-file-change', handler);
    };
  },
  onLocalFileDelete: (callback: (data: { filename: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('local-file-delete', handler);
    return () => {
      ipcRenderer.removeListener('local-file-delete', handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

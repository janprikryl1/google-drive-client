export type IElectronAPI = {
  platform: string;
  ping: () => Promise<string>;
  startWatcher: (folderPath?: string) => Promise<{ success: boolean; folderPath: string }>;
  stopWatcher: () => Promise<boolean>;
  getWatchStatus: () => Promise<{ isWatching: boolean; folderPath: string }>;
  selectWatchFolder: () => Promise<string | null>;
  saveFileToSyncFolder: (filename: string, arrayBuffer: ArrayBuffer) => Promise<{ success: boolean; path: string }>;
  deleteFileFromSyncFolder: (filename: string) => Promise<{ success: boolean }>;
  renameFileInSyncFolder: (oldFilename: string, newFilename: string) => Promise<{ success: boolean }>;
  onLocalFileChange: (callback: (data: { filename: string; base64Data: string; mimeType: string }) => void) => (() => void) | void;
  onLocalFileDelete: (callback: (data: { filename: string }) => void) => (() => void) | void;
};

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}

export interface IElectronAPI {
  platform: string;
  ping: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}

export type IElectronAPI = {
  platform: string;
  ping: () => Promise<string>;
};

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}

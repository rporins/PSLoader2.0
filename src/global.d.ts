import { IpcApi } from './preload';

declare global {
  interface Window {
    ipcApi: IpcApi;
  }
}

export {};

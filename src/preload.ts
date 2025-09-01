// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

// Define the IPC API interface
export interface IpcApi {
  sendIpcRequest: (request: string, ...args: unknown[]) => Promise<unknown>;
  onAuthSuccess: (callback: (event: any, data: any) => void) => void;
  onAuthError: (callback: (event: any, error: string) => void) => void;
  onAuthLogout: (callback: (event: any) => void) => void;
}

// Expose the API in the renderer's `window` object
contextBridge.exposeInMainWorld('ipcApi', {
  sendIpcRequest: async (request: string, ...args: unknown[]): Promise<unknown> => {
    // Use ipcRenderer.invoke to communicate with the main process
    return await ipcRenderer.invoke('ipcMain', request, ...args);
  },
  onAuthSuccess: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('auth-success', callback);
  },
  onAuthError: (callback: (event: any, error: string) => void) => {
    ipcRenderer.on('auth-error', callback);
  },
  onAuthLogout: (callback: (event: any) => void) => {
    ipcRenderer.on('auth-logout', callback);
  }
});
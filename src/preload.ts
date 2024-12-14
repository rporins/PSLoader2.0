// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

// Define the IPC API interface
export interface IpcApi {
  sendIpcRequest: (request: string, ...args: unknown[]) => Promise<unknown>;
}

// Expose the API in the renderer's `window` object
contextBridge.exposeInMainWorld('ipcApi', {
  sendIpcRequest: async (request: string, ...args: unknown[]): Promise<unknown> => {
    // Use ipcRenderer.invoke to communicate with the main process
    return await ipcRenderer.invoke('ipcMain', request, ...args);
  }
});
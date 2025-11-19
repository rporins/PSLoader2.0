// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

// IPC Channel constants (matching the ones in main process)
const IPC_CHANNELS = {
  // Auth channels
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_CHECK: 'auth:check',

  // Hardware channels
  HARDWARE_GET_INFO: 'hardware:get-info',
  HARDWARE_GET_PERMANENT_SALT: 'hardware:get-permanent-salt',

  // Database channels (legacy support)
  DB_GET_PERIODS: 'db:get-periods',
  DB_UPDATE_PERIODS: 'db:update-periods',
  DB_GET_ACCOUNTS: 'db:get-accounts',
  DB_CREATE_ACCOUNT: 'db:create-account',
  DB_GET_DEPARTMENTS: 'db:get-departments',
  DB_CREATE_DEPARTMENT: 'db:create-department',
  DB_GET_COMBO_METADATA: 'db:get-combo-metadata',
  DB_CREATE_COMBO: 'db:create-combo',
  DB_GENERATE_DUMMY_DATA: 'db:generate-dummy-data',
} as const;

// Legacy channel mappings for backward compatibility
const LEGACY_CHANNEL_MAP: Record<string, string> = {
  'auth-login': IPC_CHANNELS.AUTH_LOGIN,
  'auth-logout': IPC_CHANNELS.AUTH_LOGOUT,
  'auth-check': IPC_CHANNELS.AUTH_CHECK,
  'Get12periods': IPC_CHANNELS.DB_GET_PERIODS,
  'Update12periods': IPC_CHANNELS.DB_UPDATE_PERIODS,
  'db-get-all-accounts': IPC_CHANNELS.DB_GET_ACCOUNTS,
  'db-create-account': IPC_CHANNELS.DB_CREATE_ACCOUNT,
  'db-get-all-departments': IPC_CHANNELS.DB_GET_DEPARTMENTS,
  'db-create-department': IPC_CHANNELS.DB_CREATE_DEPARTMENT,
  'db-get-all-combo-metadata': IPC_CHANNELS.DB_GET_COMBO_METADATA,
  'db-create-combo': IPC_CHANNELS.DB_CREATE_COMBO,
  'GenerateDummyData': IPC_CHANNELS.DB_GENERATE_DUMMY_DATA,
};

// Define the IPC API interface
export interface IpcApi {
  sendIpcRequest: (request: string, ...args: unknown[]) => Promise<unknown>;
  getHardwareInfo: () => Promise<{
    machineId: string;
    biosSerial: string;
    motherboardSerial: string;
    diskSerial: string;
    macAddresses: string[];
    cpuInfo: { model: string; cores: number };
    memoryTotal: number;
  }>;
  getPermanentSalt: () => Promise<string>;
  onAuthSuccess: (callback: (event: any, data: any) => void) => void;
  onAuthError: (callback: (event: any, error: string) => void) => void;
  onAuthLogout: (callback: (event: any) => void) => void;
  offAuthSuccess?: (callback: (event: any, data: any) => void) => void;
  offAuthError?: (callback: (event: any, error: string) => void) => void;
  offAuthLogout?: (callback: (event: any) => void) => void;
}

// Expose the API in the renderer's `window` object
contextBridge.exposeInMainWorld('ipcApi', {
  sendIpcRequest: async (request: string, ...args: unknown[]): Promise<unknown> => {
    // Map legacy channels to new channels for backward compatibility
    const channel = LEGACY_CHANNEL_MAP[request] || request;

    // Use ipcRenderer.invoke to communicate with the main process
    const result = await ipcRenderer.invoke('ipcMain', channel, ...args);

    // Debug logging for db:get-all-mapping-configs
    if (request === 'db:get-all-mapping-configs') {
      console.log('[preload] db:get-all-mapping-configs raw result:', result);
      console.log('[preload] db:get-all-mapping-configs has data?:', result?.data);
    }

    // Handle the new wrapped response format
    if (result && typeof result === 'object' && 'success' in result) {
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }
      // Always return the full result object for consistency
      return result;
    }

    // Return raw result for backward compatibility
    return result;
  },
  getHardwareInfo: async () => {
    const result = await ipcRenderer.invoke('ipcMain', IPC_CHANNELS.HARDWARE_GET_INFO);
    if (result && typeof result === 'object' && 'success' in result) {
      if (!result.success) {
        throw new Error(result.error || 'Failed to get hardware info');
      }
      return result.data;
    }
    return result;
  },
  getPermanentSalt: async () => {
    const result = await ipcRenderer.invoke('ipcMain', IPC_CHANNELS.HARDWARE_GET_PERMANENT_SALT);
    if (result && typeof result === 'object' && 'success' in result) {
      if (!result.success) {
        throw new Error(result.error || 'Failed to get permanent salt');
      }
      return result.data;
    }
    return result;
  },
  onAuthSuccess: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('auth-success', callback);
  },
  onAuthError: (callback: (event: any, error: string) => void) => {
    ipcRenderer.on('auth-error', callback);
  },
  onAuthLogout: (callback: (event: any) => void) => {
    ipcRenderer.on('auth-logout', callback);
  },
  offAuthSuccess: (callback: (event: any, data: any) => void) => {
    ipcRenderer.off('auth-success', callback);
  },
  offAuthError: (callback: (event: any, error: string) => void) => {
    ipcRenderer.off('auth-error', callback);
  },
  offAuthLogout: (callback: (event: any) => void) => {
    ipcRenderer.off('auth-logout', callback);
  }
});
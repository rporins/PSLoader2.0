/**
 * App IPC Handlers
 * Handles app-level operations like version checks and updates
 */

import { autoUpdater } from 'electron-updater';
import { BrowserWindow, app } from 'electron';
import type { IpcHandler } from '../types';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Create app-related IPC handlers
 */
export function createAppHandlers(): Record<string, IpcHandler> {
  return {
    'app:get-version': async () => {
      return { version: app.getVersion() };
    },

    'app:check-for-updates': async () => {
      // Skip update check in development
      if (isDev) {
        return {
          updateAvailable: false,
          currentVersion: app.getVersion(),
          latestVersion: app.getVersion()
        };
      }

      // This will trigger update events that we forward to renderer
      const result = await autoUpdater.checkForUpdates();
      return {
        updateAvailable: result?.updateInfo?.version !== app.getVersion(),
        currentVersion: app.getVersion(),
        latestVersion: result?.updateInfo?.version
      };
    },

    'app:download-update': async () => {
      await autoUpdater.downloadUpdate();
      return { success: true };
    },

    'app:install-update': async () => {
      // This will quit and install the update
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    },
  };
}

/**
 * Setup auto-updater event forwarding to renderer
 * Call this from main.ts after window is created
 */
export function setupAutoUpdaterEvents(mainWindow: BrowserWindow | null): void {
  if (!mainWindow) return;

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-not-available');
  });

  autoUpdater.on('download-progress', (progressInfo) => {
    mainWindow.webContents.send('download-progress', {
      percent: progressInfo.percent,
      transferred: progressInfo.transferred,
      total: progressInfo.total,
    });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
  });

  autoUpdater.on('error', (error) => {
    mainWindow.webContents.send('update-error', error.message || 'Update failed');
  });
}

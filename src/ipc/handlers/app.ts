/**
 * App IPC Handlers
 * Handles app-level operations like version checks and updates
 */

import { autoUpdater } from 'electron-updater';
import { BrowserWindow, app } from 'electron';
import type { IpcHandler } from '../types';

// Use app.isPackaged to properly detect production vs development
// app.isPackaged is true when running from a built/installed app
// app.isPackaged is false when running with npm start
const isDev = !app.isPackaged;

/**
 * Create app-related IPC handlers
 */
export function createAppHandlers(): Record<string, IpcHandler> {
  return {
    'app:get-version': async () => {
      return { version: app.getVersion() };
    },

    'app:check-for-updates': async () => {
      console.log('[AppHandlers] Checking for updates...');
      console.log('[AppHandlers] Current version:', app.getVersion());
      console.log('[AppHandlers] isDev:', isDev);

      if (isDev) {
        console.log('[AppHandlers] DEV MODE: Auto-updater only works in packed builds');
        console.log('[AppHandlers] To test updates, run: npm run package');
        // In dev mode, electron-updater won't actually check GitHub
        return {
          updateAvailable: false,
          currentVersion: app.getVersion(),
          latestVersion: app.getVersion(),
          devMode: true,
          message: 'Update checks only work in production builds'
        };
      }

      try {
        // Check for updates (production only)
        const result = await autoUpdater.checkForUpdates();
        const latestVersion = result?.updateInfo?.version;
        const updateAvailable = latestVersion && latestVersion !== app.getVersion();

        console.log('[AppHandlers] Latest version:', latestVersion);
        console.log('[AppHandlers] Update available:', updateAvailable);

        // In production, the events will be triggered automatically
        return {
          updateAvailable: !!updateAvailable,
          currentVersion: app.getVersion(),
          latestVersion: latestVersion || app.getVersion(),
          devMode: false
        };
      } catch (error: any) {
        console.error('[AppHandlers] Update check failed:', error.message);
        throw error;
      }
    },

    'app:download-update': async () => {
      if (isDev) {
        console.log('[AppHandlers] DEV MODE: Skipping download');
        return { success: true, devMode: true };
      }
      console.log('[AppHandlers] Downloading update...');
      await autoUpdater.downloadUpdate();
      return { success: true };
    },

    'app:install-update': async () => {
      if (isDev) {
        console.log('[AppHandlers] DEV MODE: Skipping install');
        return { success: true, devMode: true };
      }
      console.log('[AppHandlers] Installing update and restarting...');
      // isSilent=true (silent install), isForceRunAfter=true (restart after)
      autoUpdater.quitAndInstall(true, true);
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

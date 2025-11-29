/**
 * Electron Main Process with Modular IPC Architecture
 * -----------------------------------------------------------
 */

import { app, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import path from "path";
import dotenv from "dotenv";
import { initializeDatabase } from "./local_db";
import { initializeIpc } from "./ipc";
import { setupAutoUpdaterEvents } from "./ipc/handlers/app";

// ────────────────────────────────────────────────────────────
// 0) ENV + GLOBAL DECLS (Vite globals, .env loading)
// ────────────────────────────────────────────────────────────

dotenv.config();

// ────────────────────────────────────────────────────────────
// Configure electron-log for auto-updater debugging
// Logs are saved to: C:\Users\ricis\Documents\PSLoader\updater.log
// ────────────────────────────────────────────────────────────
log.transports.file.resolvePathFn = () => path.join('C:\\Users\\ricis\\Documents\\PSLoader', 'updater.log');
log.transports.file.level = "info";
autoUpdater.logger = log;

/**
 * Vite's Electron plugin exposes these build-time globals.
 * Declare them so TypeScript is happy in this file.
 */
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL:
  | string
  | undefined;
declare const MAIN_WINDOW_VITE_NAME:
  | string
  | undefined;

// ────────────────────────────────────────────────────────────
// 1) SECURITY + APP SINGLETON GUARD
//    Prevent multiple instances and ensure safe defaults.
// ────────────────────────────────────────────────────────────

/**
 * Never allow two instances to run simultaneously.
 * Required for consistent deep-link handling and DB/file locks.
 */
const hasInstanceLock = app.requestSingleInstanceLock();
if (!hasInstanceLock) {
  app.quit();
}

// Squirrel (Windows) install/uninstall shortcut handler — exit early.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  if (require("electron-squirrel-startup")) {
    app.quit();
  }
} catch {
  // ignore if not present
}

// ────────────────────────────────────────────────────────────
// 2) TYPES + LIGHTWEIGHT LOGGER
// ────────────────────────────────────────────────────────────

type Nullable<T> = T | null;

/**
 * Tiny logger wrapper — swap for a structured logger in prod (e.g. pino).
 * Learner-friendly but production-safe: gate debug by NODE_ENV.
 */
const LOG_LEVEL =
  (process.env.LOG_LEVEL ?? "").toLowerCase(); // "debug" to force debug logging
const isDev = process.env.NODE_ENV !== "production";
const logger = {
  info: (...args: unknown[]) => console.log("[INFO ]", ...args),
  warn: (...args: unknown[]) => console.warn("[WARN ]", ...args),
  error: (...args: unknown[]) => console.error("[ERROR]", ...args),
  debug: (...args: unknown[]) => {
    if (isDev || LOG_LEVEL === "debug") {
      console.debug("[DEBUG]", ...args);
    }
  },
};

// ────────────────────────────────────────────────────────────
// 3) WINDOW MANAGEMENT (main window creation + utilities)
// ────────────────────────────────────────────────────────────

let mainWindow: Nullable<BrowserWindow> = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    show: false, // show when ready-to-show for smoother UX
    autoHideMenuBar: true, // Hide menu bar (File, Edit, View, Window)
    icon: path.join(__dirname, "../src/images/marriott_logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true, // critical for security
      webSecurity: false, // Disable CORS for desktop app - allows API requests to any origin
      devTools: true, // Keep devTools available but don't open by default
    },
  });

  // Load the UI (Vite dev or production file).
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const rendererPath = path.join(
      __dirname,
      `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
    );
    logger.info('Loading renderer from:', rendererPath);
    logger.info('__dirname:', __dirname);
    logger.info('MAIN_WINDOW_VITE_NAME:', MAIN_WINDOW_VITE_NAME);
    void mainWindow.loadFile(rendererPath);
  }

  // Log any load failures
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    logger.error('Failed to load:', validatedURL, 'Error:', errorDescription, 'Code:', errorCode);
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    // DevTools can be opened with Ctrl+Shift+I or F12 (Electron default shortcuts)
    // No automatic opening in production or development
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/** Safe send to renderer (no-op if window gone). */
function sendToRenderer(channel: string, payload?: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

// ────────────────────────────────────────────────────────────
// 4) MODULAR IPC SYSTEM INITIALIZATION
//    Using the new registry-based architecture
// ────────────────────────────────────────────────────────────

// The IPC handlers are now organized in separate modules and
// initialized through the registry system. See src/ipc/ for details.

/**
 * Stub auth service for main process
 * TODO: Replace with actual main-process auth service
 */
const stubAuthService = {
  startLogin: async (): Promise<void> => {
    logger.debug("Auth: startLogin called (stub)");
  },
  logout: (): void => {
    logger.debug("Auth: logout called (stub)");
  },
  isAuthenticated: (): boolean => false,
  getTokenSet: (): null => null,
};

// ────────────────────────────────────────────────────────────
// 5) AUTO-UPDATER CONFIGURATION
// ────────────────────────────────────────────────────────────

/**
 * Configure auto-updater behavior
 * For private repos, set GH_TOKEN environment variable
 */
autoUpdater.autoDownload = true; // Automatically download updates when found
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowDowngrade = false; // Prevent downgrades
autoUpdater.allowPrerelease = false; // Skip pre-releases

// Auto-updater event handlers for logging
autoUpdater.on("checking-for-update", () => {
  logger.info("Checking for updates...");
});

autoUpdater.on("update-available", (info) => {
  logger.info("Update available:", info.version);
});

autoUpdater.on("update-not-available", (info) => {
  logger.info("No updates available:", info.version);
});

autoUpdater.on("download-progress", (progressObj) => {
  logger.debug(`Download progress: ${progressObj.percent}%`);
});

autoUpdater.on("update-downloaded", (info) => {
  logger.info("Update downloaded:", info.version);
});

autoUpdater.on("error", (err) => {
  logger.error("Auto-updater error:", err);
});

// ────────────────────────────────────────────────────────────
// 6) APP LIFECYCLE (create window, init DB & IPC)
// ────────────────────────────────────────────────────────────

app.on("ready", async () => {
  try {
    // Initialize the new modular IPC system
    initializeIpc(stubAuthService, sendToRenderer, logger);

    // Initialize local database before UI interaction.
    await initializeDatabase();

    createMainWindow();

    // Setup auto-updater event forwarding to renderer
    setupAutoUpdaterEvents(mainWindow);
  } catch (err) {
    logger.error("Startup error:", err);
    // In a real prod app, consider user-facing error UI here.
  }
});

// Cross-platform window behavior
app.on("window-all-closed", () => {
  // On macOS, apps typically remain active until Cmd+Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // Re-create a window if the dock icon is clicked and no windows are open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Global safety nets (don’t crash silently in prod).
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection:", reason);
});

/**
 * Electron Main Process with Modular IPC Architecture
 * -----------------------------------------------------------
 */

import { app, BrowserWindow, shell } from "electron";
import path from "path";
import dotenv from "dotenv";
import { initializeDatabase } from "./local_db";
import { initializeIpc } from "./ipc";

// ────────────────────────────────────────────────────────────
// 0) ENV + GLOBAL DECLS (Vite globals, .env loading)
// ────────────────────────────────────────────────────────────

dotenv.config();

/**
 * Vite’s Electron plugin exposes these build-time globals.
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
// 2) CONSTANTS (OIDC/Keycloak + Deep Link Scheme)
// ────────────────────────────────────────────────────────────

/**
 * IMPORTANT: Prefer envs in production; keep defaults here for dev.
 * KEYCLOAK_BASE: issuer/realm URL, e.g., https://auth.example.com/realms/MyRealm
 * CLIENT_ID: OIDC public client configured for PKCE
 * REDIRECT_URI: must be registered at the IdP; protocol must match `DEEP_LINK_SCHEME`
 */
const KEYCLOAK_BASE =
  process.env.KEYCLOAK_BASE ??
  "https://auth.rebyter.com/realms/ReByter";
const CLIENT_ID =
  process.env.OIDC_CLIENT_ID ?? "rebyter-electron";
const DEEP_LINK_SCHEME = "rebyter";
const REDIRECT_URI = `${DEEP_LINK_SCHEME}://auth-callback/`;

// ────────────────────────────────────────────────────────────
// 3) TYPES + LIGHTWEIGHT LOGGER
// ────────────────────────────────────────────────────────────

type Nullable<T> = T | null;

/**
 * Minimal shape for token sets returned by openid-client.
 * We avoid hard dependency on types since we import dynamically.
 */
type TokenSetLike = {
  access_token?: string;
  id_token?: string;
  expires_at?: number;
  claims: () => Record<string, unknown>;
  [k: string]: unknown;
};

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
// 4) AUTH SERVICE (OIDC PKCE with dynamic imports)
//    - isolates auth state + logic
//    - makes unit testing easier and keeps globals clean
// ────────────────────────────────────────────────────────────

class AuthService {
  private client: any | null = null;
  private tokens: TokenSetLike | null = null;
  private codeVerifier: string | null = null;
  private verifierTimeout: NodeJS.Timeout | null = null;

  /** Discover OIDC config and prepare a client. */
  async initialize(): Promise<void> {
    try {
      const { discovery } = await import("openid-client");
      this.client = await discovery(new URL(KEYCLOAK_BASE), CLIENT_ID);
      logger.info("Auth client initialized.");
    } catch (err) {
      logger.error("Failed to initialize auth client:", err);
      this.client = null;
      throw err;
    }
  }

  /**
   * Starts the PKCE login by opening the system browser to the authorization URL.
   * Stores the code_verifier for the callback step.
   */
  async startLogin(): Promise<void> {
    if (!this.client) {
      await this.initialize().catch(() => {
        throw new Error("Auth initialization failed.");
      });
    }
    if (!this.client) {
      throw new Error("Auth client unavailable.");
    }

    const {
      randomPKCECodeVerifier,
      calculatePKCECodeChallenge,
      buildAuthorizationUrl,
    } = await import("openid-client");

    this.clearVerifier(); // safety: clear any stale verifier
    this.codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(
      this.codeVerifier
    );

    // Auto-expire the verifier to avoid replay/stale issues (10 min)
    this.verifierTimeout = setTimeout(() => {
      logger.warn("PKCE code_verifier expired.");
      this.clearVerifier();
    }, 10 * 60 * 1000);

    const url = buildAuthorizationUrl(this.client, {
      redirect_uri: REDIRECT_URI,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      scope: "openid profile email",
    });

    logger.debug("Opening auth URL:", url.toString());
    await shell.openExternal(url.toString());
  }

  /**
   * Completes the code exchange upon deep-link callback.
   * Returns user claims and access token (if present) for UI consumption.
   */
  async handleCallback(callbackUrl: string): Promise<{
    claims: Record<string, unknown>;
    accessToken?: string;
    rawTokenSet: TokenSetLike;
  }> {
    if (!this.client) {
      await this.initialize();
    }
    if (!this.client) {
      throw new Error("Auth client unavailable.");
    }

    const url = new URL(callbackUrl);
    const params = Object.fromEntries(url.searchParams);

    if (params.error) {
      const errMsg = `${params.error}: ${
        params.error_description ?? "unknown"
      }`;
      throw new Error(`Auth error: ${errMsg}`);
    }

    if (!params.code) {
      throw new Error("Missing authorization code in callback.");
    }

    if (!this.codeVerifier) {
      throw new Error(
        "No PKCE code_verifier found. Session may have expired."
      );
    }

    const { authorizationCodeGrant } = await import("openid-client");
    logger.debug("Exchanging code for tokens…", {
      redirect_uri: REDIRECT_URI,
    });

    const tokenSet = (await authorizationCodeGrant(
      this.client,
      url,
      {
        pkceCodeVerifier: this.codeVerifier,
        redirect_uri: REDIRECT_URI,
      }
    )) as TokenSetLike;

    this.tokens = tokenSet;
    this.clearVerifier();

    const claims = tokenSet.claims?.() ?? {};
    logger.info(
      "Login successful.",
      claims["preferred_username"] ??
        claims["email"] ??
        claims["sub"] ??
        "Unknown user"
    );

    return {
      claims,
      accessToken: tokenSet.access_token,
      rawTokenSet: tokenSet,
    };
  }

  /** Clears current tokens and notifies caller. */
  logout(): void {
    this.tokens = null;
    this.clearVerifier();
    logger.info("User logged out.");
  }

  isAuthenticated(): boolean {
    return !!this.tokens;
  }

  getTokenSet(): TokenSetLike | null {
    return this.tokens;
  }

  private clearVerifier(): void {
    this.codeVerifier = null;
    if (this.verifierTimeout) {
      clearTimeout(this.verifierTimeout);
      this.verifierTimeout = null;
    }
  }
}

const auth = new AuthService();

// ────────────────────────────────────────────────────────────
// 5) WINDOW MANAGEMENT (main window creation + utilities)
// ────────────────────────────────────────────────────────────

let mainWindow: Nullable<BrowserWindow> = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    show: false, // show when ready-to-show for smoother UX
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true, // critical for security
    },
  });

  // Load the UI (Vite dev or production file).
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(
      path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
      )
    );
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: "detach" });
    }
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
// 6) DEEP LINK HANDLING (custom protocol + platform nuances)
// ────────────────────────────────────────────────────────────

/**
 * Register the app as a handler for the custom scheme.
 * Dev vs packaged behavior differs slightly on Windows.
 */
function registerProtocolHandler(): void {
  if (process.defaultApp) {
    // Running via `electron .` in development — need exec path + app path
    app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  } else {
    // Packaged app
    app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME);
  }
}

/** Extract a deep-link from argv (Windows/Linux). */
function getDeepLinkFromArgv(argv: string[]): string | null {
  return argv.find((a) => a.startsWith(`${DEEP_LINK_SCHEME}://`)) ?? null;
}

/** Handle a deep-link URL (from startup or runtime). */
async function handleDeepLink(url: string): Promise<void> {
  logger.debug("Deep link received:", url);
  try {
    const result = await auth.handleCallback(url);
    sendToRenderer("auth-success", {
      user: result.rawTokenSet,
      accessToken: result.accessToken,
    });
  } catch (err: any) {
    logger.error("Auth callback error:", err);
    sendToRenderer(
      "auth-error",
      err?.message ?? "Authentication failed."
    );
  }
}

// When a second instance is launched (Windows/Linux), forward the deep link.
app.on("second-instance", (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  const link = getDeepLinkFromArgv(argv);
  if (link) void handleDeepLink(link);
});

// macOS: deep links arrive via open-url
app.on("open-url", (event, url) => {
  event.preventDefault();
  if (app.isReady()) {
    void handleDeepLink(url);
  } else {
    app.whenReady().then(() => void handleDeepLink(url));
  }
});

// On cold start (Windows/Linux), argv may already contain the link.
const startupDeepLink = getDeepLinkFromArgv(process.argv);

// ────────────────────────────────────────────────────────────
// 7) MODULAR IPC SYSTEM INITIALIZATION
//    Using the new registry-based architecture
// ────────────────────────────────────────────────────────────

// The IPC handlers are now organized in separate modules and
// initialized through the registry system. See src/ipc/ for details.

// ────────────────────────────────────────────────────────────
// 8) APP LIFECYCLE (create window, register protocol, init DB)
// ────────────────────────────────────────────────────────────

app.on("ready", async () => {
  try {
    registerProtocolHandler();

    // Initialize the new modular IPC system
    initializeIpc(auth, sendToRenderer, logger);

    // Initialize auth eagerly so first login is snappy.
    await auth.initialize().catch((e) =>
      logger.warn("Auth init warning (will retry on login):", e)
    );

    // Initialize local database before UI interaction.
    await initializeDatabase();

    createMainWindow();

    // If we were launched via deep link (Windows/Linux cold start), handle it.
    if (startupDeepLink) {
      // slight delay to ensure window + preload listeners are ready
      setTimeout(() => void handleDeepLink(startupDeepLink), 500);
    }
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

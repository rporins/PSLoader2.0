/**
 * Renderer auth client (thin facade over the main-process auth domain).
 * -----------------------------------------------------------
 * The renderer holds NO token and performs NO device/crypto work — all of that
 * now lives in the Node main process. This client:
 *   - delegates auth actions to window.authApi (login / verify / TOTP / logout);
 *   - keeps a CACHED projection of the public session status so that
 *     ProtectedRoute and other callers can read securityLevel synchronously;
 *   - exposes a few business reads (hotels / me / OU access) that route through
 *     the main-process authenticated transport via the `api` seam.
 *
 * The public method names match the previous renderer AuthService so existing
 * screens (login, device-verify, totp, password reset, profile) keep working.
 */

import api from "./api";

// ── Public status projected from main (never contains a token) ──
export interface PublicAuthStatus {
  securityLevel: number; // 0 none, 1 login, 2 device-verified, 3 TOTP
  isActive: boolean;
  deviceId: string | null;
  devicePending: boolean;
  encryptionAvailable: boolean;
  lastUserEmail: string | null;
  stepUpRequired: boolean;
}

// ── Domain types re-exported for consumers (unchanged shapes) ──
export interface AuthTokenResponse {
  access_token?: string;
  token_type?: string;
  settings: unknown;
}

export interface DeviceVerifyResponse {
  deviceId: string;
  securityLevel: number;
}

export interface TOTPGenerateResponse {
  message: string;
  expiresInMinutes: number;
}

export interface TOTPVerifyResponse {
  securityLevel: number;
}

export interface UserInfo {
  email: string;
  id: number;
}

export interface OUAccess {
  id: number;
  user_id: number;
  ou: string;
  granted_by: number;
  granted_at: string;
  expires_at: string;
  access_level: string;
  is_active: boolean;
}

export interface Hotel {
  ou: string;
  hotel_name: string;
  room_count: number;
  currency?: string;
  country?: string;
  city?: string;
  local_id_1?: string;
  local_id_2?: string;
  local_id_3?: string;
}

export interface DeviceRegisterResponse {
  status: string;
  deviceId: string;
}

export interface PasswordResetRequestResponse {
  message: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

// ── Window augmentation for the typed auth bridge ──
import type { AuthApi } from "../preload";
declare global {
  interface Window {
    authApi?: AuthApi;
  }
}

const EMPTY_STATUS: PublicAuthStatus = {
  securityLevel: 0,
  isActive: false,
  deviceId: null,
  devicePending: false,
  encryptionAvailable: false,
  lastUserEmail: null,
  stepUpRequired: false,
};

class AuthClient {
  private status: PublicAuthStatus = { ...EMPTY_STATUS };
  private bootstrapped: Promise<void> | null = null;

  // Background cold-start resume state (drives the login "Continue session" UI).
  private resumable = false; // a token worth trying exists (fast local check)
  private resolving = false; // the background /auth/refresh is still in flight
  private resolved = false; // the resume attempt has completed

  private listeners = new Set<() => void>();

  constructor() {
    // Keep the cached status in sync with main-pushed changes (e.g. proactive
    // refresh level changes, session expiry).
    if (typeof window !== "undefined" && window.authApi) {
      window.authApi.onAuthStatusChanged((status) => {
        this.status = status;
        this.notify();
      });
    }
  }

  /** Subscribe to status/resume-state changes (for reactive components). */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Load the initial status and kick off the cold-start resume in the
   * BACKGROUND (non-blocking). Returns as soon as the fast local checks are
   * done, so the app renders immediately (no splash). The actual /auth/refresh
   * resolves later and updates the cached status + notifies subscribers, which
   * drives the login page's "Continue session" affordance.
   */
  bootstrap(): Promise<void> {
    if (!this.bootstrapped) {
      this.bootstrapped = (async () => {
        try {
          if (!window.authApi) {
            this.resolved = true;
            return;
          }
          this.status = await window.authApi.getStatus(); // pure read, no network
          this.resumable = await window.authApi.hasResumableSession(); // fast, local

          if (this.resumable) {
            this.resolving = true;
            this.notify();
            // Fire the real resume without awaiting — the app renders now.
            window.authApi
              .resume()
              .then((status) => {
                this.status = status;
              })
              .catch((error) => {
                console.error("[auth] Background resume failed:", error);
              })
              .finally(() => {
                this.resolving = false;
                this.resolved = true;
                this.notify();
              });
          } else {
            this.resolved = true;
          }
        } catch (error) {
          console.error("[auth] Failed to bootstrap auth status:", error);
          this.resolved = true;
        } finally {
          this.notify();
        }
      })();
    }
    return this.bootstrapped;
  }

  /** True while the background resume is still checking the token. */
  isResolving(): boolean {
    return this.resolving;
  }

  /** True when a token worth resuming exists (fast local pre-check passed). */
  hasResumableSession(): boolean {
    return this.resumable;
  }

  /** True once the resume attempt has completed (success or failure). */
  isResumeResolved(): boolean {
    return this.resolved;
  }

  // ── Synchronous cached reads (used by route guards / UI) ──
  getSecurityLevel(): number {
    return this.status.securityLevel;
  }

  isAuthenticated(): boolean {
    return this.status.securityLevel >= 3;
  }

  getDeviceId(): string | null {
    return this.status.deviceId;
  }

  /** Remembered email from a previous login, for prefilling the login form. */
  getLastUserEmail(): string | null {
    return this.status.lastUserEmail;
  }

  /** True when a cold-start resume still needs a fresh TOTP before data access. */
  isStepUpRequired(): boolean {
    return this.status.stepUpRequired;
  }

  getStatusSnapshot(): PublicAuthStatus {
    return this.status;
  }

  onSessionExpired(cb: () => void): void {
    window.authApi?.onSessionExpired(cb);
  }

  offSessionExpired(cb: () => void): void {
    window.authApi?.offSessionExpired(cb);
  }

  private setLevel(securityLevel: number): void {
    // Any explicit auth transition (login / verify / TOTP) also resolves a
    // pending cold-start step-up.
    this.status = {
      ...this.status,
      securityLevel,
      isActive: securityLevel >= 2,
      stepUpRequired: false,
    };
    this.notify();
  }

  // ── Auth handshake (delegates to main; updates cached status from results) ──
  async login(email: string, password: string): Promise<AuthTokenResponse> {
    const result = await this.requireAuthApi().login({ email, password });
    this.setLevel(1);
    return { settings: (result as any)?.settings ?? null };
  }

  async verifyDevice(): Promise<DeviceVerifyResponse> {
    const result = await this.requireAuthApi().verifyDevice();
    this.setLevel(result.securityLevel);
    this.status = { ...this.status, deviceId: result.deviceId, devicePending: false };
    this.notify();
    return result;
  }

  async registerDevice(): Promise<DeviceRegisterResponse> {
    const result = await this.requireAuthApi().registerDevice();
    this.status = { ...this.status, deviceId: result.deviceId, devicePending: true };
    this.notify();
    return result;
  }

  async generateTOTP(): Promise<TOTPGenerateResponse> {
    return this.requireAuthApi().generateTotp();
  }

  async verifyTOTP(code: string): Promise<TOTPVerifyResponse> {
    const result = await this.requireAuthApi().submitTotp({ code });
    this.setLevel(result.securityLevel);
    return result;
  }

  async logout(): Promise<void> {
    try {
      await this.requireAuthApi().logout();
    } finally {
      // Keep non-secret hints (encryption availability, remembered email) so the
      // next login can still prefill; only the session/level is cleared.
      this.status = {
        ...EMPTY_STATUS,
        encryptionAvailable: this.status.encryptionAvailable,
        lastUserEmail: this.status.lastUserEmail,
        deviceId: this.status.deviceId,
      };
      // Signing out removes the on-disk token, so there's nothing to resume.
      this.resumable = false;
      this.resolving = false;
      this.resolved = true;
      this.notify();
    }
  }

  /** Local-only reset (main owns real teardown; kept for legacy call sites). */
  clearAuth(): void {
    this.setLevel(0);
  }

  async requestPasswordReset(email: string): Promise<PasswordResetRequestResponse> {
    return this.requireAuthApi().requestPasswordReset({ email });
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<PasswordResetConfirmResponse> {
    return this.requireAuthApi().confirmPasswordReset({ token, newPassword });
  }

  // ── Business reads (routed through the main-process authed transport) ──
  async getCurrentUser(): Promise<UserInfo> {
    const response = await api.get("/auth/me");
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to get user info");
    }
    return response.json();
  }

  async getUserOUAccess(): Promise<OUAccess[]> {
    const response = await api.get("/users/ou-access/my-access");
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to get OU access");
    }
    return response.json();
  }

  async getHotels(): Promise<Hotel[]> {
    const response = await api.get("/hotels/");
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to get hotels");
    }
    const hotels = await response.json();

    // Cache locally (fetch + cache remain a single logical read for the UI).
    if (typeof window !== "undefined" && window.ipcApi) {
      try {
        await window.ipcApi.sendIpcRequest("db:cache-hotels", hotels);
      } catch {
        // Non-fatal cache failure.
      }
    }
    return hotels;
  }

  async refreshHotelsCache(): Promise<Hotel[]> {
    if (typeof window !== "undefined" && window.ipcApi) {
      try {
        await window.ipcApi.sendIpcRequest("db:clear-hotels-cache");
      } catch {
        // Non-fatal.
      }
    }
    return this.getHotels();
  }

  private requireAuthApi(): AuthApi {
    if (typeof window === "undefined" || !window.authApi) {
      throw new Error("Auth bridge unavailable");
    }
    return window.authApi;
  }
}

export default new AuthClient();

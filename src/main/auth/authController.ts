/**
 * AuthController — orchestrates the 3-step auth handshake and owns the public
 * status projected to the renderer. This is the only auth surface the IPC layer
 * (and therefore the renderer) can reach; it never returns a token.
 *
 * Ported from the former renderer AuthService (src/services/auth.ts). Request
 * shapes are preserved so the deployed backend and existing devices keep working.
 */

import os from "os";
import { app } from "electron";
import * as db from "../../local_db";
import { SessionManager } from "./sessionManager";
import { DeviceIdentity } from "./deviceIdentity";
import { SecureStore } from "./secureStore";
import { ApiClient, ApiError, extractDetail } from "./apiClient";
import { gatherHardwareInfo } from "../system/hardwareInfo";

/** user_settings key holding the last-used login email (not a secret). */
const LAST_USER_EMAIL_KEY = "last_user_email";
/** user_settings key toggling the cold-start TOTP step-up (default on). */
const REQUIRE_TOTP_ON_LAUNCH_KEY = "require_totp_on_launch";

/** Token-free session status pushed to / polled by the renderer. */
export interface PublicAuthStatus {
  securityLevel: number; // 0 none, 1 login, 2 device-verified, 3 TOTP
  isActive: boolean; // refresh-backed session at Level 2+
  deviceId: string | null;
  devicePending: boolean; // device awaiting admin approval
  encryptionAvailable: boolean; // safeStorage/DPAPI usable -> resume across restarts
  lastUserEmail: string | null; // remembered for login prefill (not a secret)
  stepUpRequired: boolean; // cold-start resume needs a fresh TOTP before data access
}

/** Sentinels the renderer routes branch on (kept identical to the old flow). */
export const DEVICE_NOT_REGISTERED = "DEVICE_NOT_REGISTERED";
export const DEVICE_SECRET_INVALID = "DEVICE_SECRET_INVALID";

export interface AuthControllerDeps {
  sessionManager: SessionManager;
  deviceIdentity: DeviceIdentity;
  secureStore: SecureStore;
  apiClient: ApiClient;
  sendToRenderer: (channel: string, payload?: unknown) => void;
}

export class AuthController {
  private deviceId: string | null = null;
  private devicePending = false;
  private lastUserEmail: string | null = null;

  constructor(private deps: AuthControllerDeps) {}

  /**
   * Wire session notifications to the renderer and preload the device id +
   * remembered email. Call once after app `ready` (and after DB init).
   */
  async init(): Promise<void> {
    this.deps.sessionManager.onChange = () => this.pushStatus();
    this.deps.sessionManager.onExpired = () =>
      this.deps.sendToRenderer("auth:session-expired");
    this.deviceId = await this.deps.deviceIdentity.getDeviceId();
    this.lastUserEmail = await this.loadLastUserEmail();
    this.deps.sessionManager.requireStepUpOnResume = await this.loadRequireTotpOnLaunch();
  }

  private async loadLastUserEmail(): Promise<string | null> {
    try {
      const raw = await db.getUserSettings(LAST_USER_EMAIL_KEY);
      return raw && raw !== "null" ? (raw as string) : null;
    } catch {
      return null;
    }
  }

  /** Cold-start TOTP step-up is ON unless the user has explicitly disabled it. */
  private async loadRequireTotpOnLaunch(): Promise<boolean> {
    try {
      const raw = await db.getUserSettings(REQUIRE_TOTP_ON_LAUNCH_KEY);
      return raw === false ? false : true; // default on
    } catch {
      return true;
    }
  }

  // ── Account signup (unauthenticated) ────────────────────────────

  async register(email: string, password: string): Promise<unknown> {
    const response = await this.deps.apiClient.rawFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error(await extractDetail(response));
    }
    return response.json();
  }

  // ── Step 1: Login (Level 1) ─────────────────────────────────────

  async login(email: string, password: string): Promise<{ settings: unknown }> {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);

    const response = await this.deps.apiClient.rawFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    if (!response.ok) {
      throw new Error(await extractDetail(response)); // wrong creds / pending approval
    }

    const data = await response.json(); // { access_token, token_type, settings }
    this.devicePending = false;
    this.deps.sessionManager.setLoginToken(data.access_token);

    // Remember the email for prefill on next launch (not a secret). Persisted
    // best-effort; the local SQLite DB already lives under the user's Documents.
    this.lastUserEmail = email;
    db.setUserSettings({ [LAST_USER_EMAIL_KEY]: email }).catch(() => {
      /* non-fatal */
    });

    return { settings: data.settings ?? null };
  }

  // ── Step 2: Device verify (Level 1 -> 2, mints the session) ─────

  async verifyDevice(): Promise<{ deviceId: string; securityLevel: number }> {
    const { deviceId, deviceSecret } =
      await this.deps.deviceIdentity.getCredentials();

    const response = await this.deps.apiClient.fetchOnce("/devices/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, device_secret: deviceSecret }),
    });

    if (!response.ok) {
      const detail = await extractDetail(response);
      if (response.status === 404 || detail.toLowerCase().includes("not found")) {
        throw new Error(DEVICE_NOT_REGISTERED); // -> renderer triggers registration
      }
      if (response.status === 401) {
        throw new Error(DEVICE_SECRET_INVALID); // hardware changed -> re-register
      }
      if (response.status === 403) {
        this.devicePending = true;
        this.pushStatus();
        throw new Error(detail || "Device pending approval");
      }
      throw new Error(detail || "Device verification failed");
    }

    const data = await response.json();
    // CRITICAL: adopt the NEW sid-bearing token and persist the refresh token.
    await this.deps.sessionManager.establishSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      securityLevel: data.security_level ?? 2,
    });
    this.devicePending = false;
    return { deviceId, securityLevel: this.deps.sessionManager.getSecurityLevel() };
  }

  // ── First-run: register device (stays pending until admin approval) ──

  async registerDevice(): Promise<{ status: string; deviceId: string }> {
    const { deviceId } = await this.deps.deviceIdentity.getCredentials();
    const deviceSecret = await this.deps.deviceIdentity.getDeviceSecret();

    const [hw, permanentSalt, userEmail] = await Promise.all([
      gatherHardwareInfo(),
      this.getPermanentSaltSafe(),
      this.getCurrentUserEmailSafe(),
    ]);

    const hostname = hw.hostname || "localhost";
    const username = hw.username || "Unknown User";
    const osVersion = `${os.type()} ${os.release()}`; // e.g. "Windows_NT 10.0.26100"

    const hardwareInfo = {
      machine_id: hw.machineId || "UNKNOWN",
      processor_id: hw.cpuInfo.model || "UNKNOWN",
      bios_serial: hw.biosSerial || "UNKNOWN",
      motherboard_serial: hw.motherboardSerial || "UNKNOWN",
      disk_serial: hw.diskSerial || "UNKNOWN",
    };

    const deviceInfo = {
      device_name: `${userEmail} | ${hostname} | ${username} | ${osVersion}`,
      os_version: osVersion,
      hostname,
      user_agent: `PSLoader/${app.getVersion()} Electron/${process.versions.electron}`,
      username,
      details: `${userEmail}, ${hostname}, ${username}, Salt:${permanentSalt.substring(0, 8)}...`,
    };

    const response = await this.deps.apiClient.fetchOnce("/devices/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: deviceId,
        device_secret: deviceSecret,
        hardware_info: hardwareInfo,
        device_info: deviceInfo,
      }),
    });

    if (!response.ok) {
      throw new Error(await extractDetail(response));
    }

    const data = await response.json(); // { message, device_id, approval_status/status }
    this.devicePending = true;
    this.pushStatus();
    return { status: data.approval_status ?? data.status ?? "pending", deviceId };
  }

  // ── Step 3: Email TOTP (Level 2 -> 3) ───────────────────────────

  async generateTotp(): Promise<{ message: string; expiresInMinutes: number }> {
    const response = await this.deps.apiClient.fetchOnce("/auth/totp/generate", {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(await extractDetail(response));
    }
    const data = await response.json();
    return { message: data.message, expiresInMinutes: data.expires_in_minutes };
  }

  async submitTotp(code: string): Promise<{ securityLevel: number }> {
    const response = await this.deps.apiClient.fetchOnce("/auth/totp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totp_code: code }),
    });
    if (!response.ok) {
      throw new Error(await extractDetail(response));
    }
    const data = await response.json(); // { security_level: 3, security_level_expires_at }
    this.deps.sessionManager.elevateTo(data.security_level ?? 3);
    return { securityLevel: this.deps.sessionManager.getSecurityLevel() };
  }

  // ── Logout ──────────────────────────────────────────────────────

  async logout(): Promise<{ success: true }> {
    try {
      await this.deps.apiClient.fetchOnce("/auth/logout", { method: "POST" });
    } catch (error) {
      // Best-effort server revoke; we clear locally regardless.
      console.warn("[AuthController] Logout request failed:", error);
    }
    this.devicePending = false;
    await this.deps.sessionManager.clear();
    return { success: true };
  }

  // ── Password reset (device-bound) ───────────────────────────────

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await this.deps.apiClient.rawFetch("/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      throw new Error(await extractDetail(response));
    }
    return response.json();
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const { deviceId, deviceSecret } =
      await this.deps.deviceIdentity.getCredentials();

    const response = await this.deps.apiClient.rawFetch("/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        new_password: newPassword,
        device_id: deviceId,
        device_secret: deviceSecret,
      }),
    });
    if (!response.ok) {
      throw new Error(await extractDetail(response));
    }
    return response.json();
  }

  // ── Status / resume ─────────────────────────────────────────────

  /** Pure read of the current status. Does NOT trigger a resume. */
  getStatus(): PublicAuthStatus {
    return this.buildStatus();
  }

  /**
   * Fast local check (no network) for whether a "Continue session" option
   * should be offered — a token exists and isn't already provably expired.
   */
  hasResumableSession(): Promise<boolean> {
    return this.deps.sessionManager.hasResumableSession();
  }

  /** Attempt the (background) cold-start resume, then return resolved status. */
  async resume(): Promise<PublicAuthStatus> {
    await this.deps.sessionManager.resume();
    return this.buildStatus();
  }

  private buildStatus(): PublicAuthStatus {
    return {
      securityLevel: this.deps.sessionManager.getSecurityLevel(),
      isActive: this.deps.sessionManager.isActive(),
      deviceId: this.deviceId,
      devicePending: this.devicePending,
      encryptionAvailable: this.deps.secureStore.isAvailable(),
      lastUserEmail: this.lastUserEmail,
      stepUpRequired: this.deps.sessionManager.isStepUpRequired(),
    };
  }

  private pushStatus(): void {
    this.deps.sendToRenderer("auth:status-changed", this.buildStatus());
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private async getPermanentSaltSafe(): Promise<string> {
    try {
      // Reuse the same permanent salt used in device_secret derivation.
      const { getPermanentSalt } = await import("../../local_db");
      return await getPermanentSalt();
    } catch {
      return "UNKNOWN";
    }
  }

  private async getCurrentUserEmailSafe(): Promise<string> {
    try {
      const response = await this.deps.apiClient.fetchOnce("/auth/me", {
        method: "GET",
      });
      if (!response.ok) {
        return "Unknown";
      }
      const user = await response.json();
      return user.email ?? "Unknown";
    } catch {
      return "Unknown";
    }
  }
}

export { ApiError };

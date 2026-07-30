/**
 * ApiClient — the single authenticated transport to the backend.
 * -----------------------------------------------------------
 * Every request to the API goes through here so that Bearer attachment and the
 * refresh-on-401 policy live in exactly one place (no per-endpoint copy-paste).
 *
 *   - rawFetch:    no app Authorization header (ms-exchange, login, register —
 *                  these carry the broker token, set by the caller).
 *   - fetchOnce:   attach the current access token; no refresh (auth handshake:
 *                  verify / logout — there is nothing to refresh before the
 *                  session exists, and the handshake is explicitly ordered).
 *   - authedFetch: attach the access token AND, on 401, run ONE single-flight
 *                  refresh and retry the request once (steady-state business
 *                  calls). /auth/refresh itself is owned by SessionManager.
 */

import { net } from "electron";
import { SessionManager } from "./sessionManager";

/**
 * Error carrying the HTTP status + server `detail` for level/approval mapping.
 *
 * `code` is the server's stable machine code from `{"error": <code>}` — e.g.
 * `ou_access_pending`, `app_access_not_granted`. It is the only reliable way to
 * tell "waiting on a device approval" apart from "waiting on a permission", which
 * the prose cannot do: several codes' detail text contains the word "pending".
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public readonly code: string | null = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClientDeps {
  sessionManager: SessionManager;
  baseUrl: string;
}

export class ApiClient {
  constructor(private deps: ApiClientDeps) {}

  private buildUrl(path: string): string {
    return `${this.deps.baseUrl}${path}`;
  }

  private withAuth(headers?: HeadersInit): Record<string, string> {
    const merged: Record<string, string> = { ...(headers as Record<string, string>) };
    const token = this.deps.sessionManager.getAccessToken();
    if (token) {
      merged["Authorization"] = `Bearer ${token}`;
    }
    return merged;
  }

  /** Unauthenticated request (no Authorization header). */
  rawFetch(path: string, options: RequestInit = {}): Promise<Response> {
    // Electron's net.fetch uses Chromium's network stack, so it honours the
    // system (Windows) certificate store and proxy config — matching how the
    // renderer's fetch behaved. Node's global fetch (undici) would reject
    // corporate SSL-inspection certs with SELF_SIGNED_CERT_IN_CHAIN.
    return net.fetch(this.buildUrl(path), options);
  }

  /** Authenticated request with NO refresh-retry (auth handshake calls). */
  fetchOnce(path: string, options: RequestInit = {}): Promise<Response> {
    return net.fetch(this.buildUrl(path), {
      ...options,
      headers: this.withAuth(options.headers),
    });
  }

  /**
   * Authenticated request with lazy refresh: on 401, run one single-flight
   * refresh and retry once. If the session is dead, SessionManager.refresh()
   * throws SessionExpiredError (already cleared + emitted expiry) and it bubbles.
   */
  async authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
    let response = await this.fetchOnce(path, options);
    if (response.status === 401) {
      await this.deps.sessionManager.refresh(); // single-flight; throws if dead
      response = await this.fetchOnce(path, options); // retry once with new token
    }
    return response;
  }

  // ── JSON convenience (business data handlers) ───────────────────

  /** GET a JSON resource through the refresh-aware path. */
  async getJson<T>(path: string): Promise<T> {
    return this.parse<T>(await this.authedFetch(path, { method: "GET" }));
  }

  /** POST JSON through the refresh-aware path. */
  async postJson<T>(path: string, body?: unknown): Promise<T> {
    return this.parse<T>(
      await this.authedFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    );
  }

  /** Throw ApiError(status, detail, code) on non-2xx; otherwise parse the JSON body. */
  async parse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const { detail, code } = await extractError(response);
      throw new ApiError(response.status, detail, code);
    }
    // Some endpoints (204) may have no body.
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

/**
 * Pull both halves of an error body: the FastAPI `detail` prose and the server's
 * machine `error` code. Authorization denials carry both; broker failures carry
 * only `error`; the pre-existing tier/approval denials carry only `detail`.
 *
 * A response body can only be read once, which is why this returns both rather
 * than leaving callers to re-read for the code.
 */
export async function extractError(
  response: Response
): Promise<{ detail: string; code: string | null }> {
  try {
    const body = await response.json();
    const code =
      body && typeof body.error === "string" && body.error ? body.error : null;
    if (body && typeof body.detail === "string") {
      return { detail: body.detail, code };
    }
    // No prose: fall back to the code, then to the raw body.
    return { detail: code ?? JSON.stringify(body), code };
  } catch {
    return { detail: `Request failed with status ${response.status}`, code: null };
  }
}

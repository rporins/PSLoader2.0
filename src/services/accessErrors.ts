/**
 * Access denials on the business path.
 * -----------------------------------------------------------
 * Auth-handshake errors cross IPC as a message, so they need the `AUTHZ:<code>`
 * encoding (see services/auth.ts). Business calls do not: `apiService.fetch`
 * rebuilds a real `Response` from main's { ok, status, body }, so the server's
 * `{"detail": ..., "error": <code>}` body is readable here directly.
 *
 * Use this instead of `throw new Error('Access denied to this OU')` — the code is
 * what tells "you have no hotel access yet" (fixable in the portal) apart from
 * "this hotel is read-only for you" (a different message entirely).
 */

import { AUTHZ_ERROR_PREFIX } from "../config";
import { describeAuthzError, type AuthzDenial } from "./auth";

export interface AccessDenial {
  /** Machine code from the server's `error` field, if it sent one. */
  code: string | null;
  /** FastAPI `detail` prose. */
  detail: string;
}

/**
 * Read a 403 body without consuming the caller's ability to report something.
 * Returns null when the response is not a denial we recognise.
 *
 * Pass a CLONE if the caller still needs the body — a Response body reads once.
 */
export async function readAccessDenial(
  response: Response
): Promise<AccessDenial | null> {
  if (response.status !== 403) return null;
  try {
    const body = await response.json();
    return {
      code: typeof body?.error === "string" && body.error ? body.error : null,
      detail: typeof body?.detail === "string" ? body.detail : "",
    };
  } catch {
    return { code: null, detail: "" };
  }
}

/**
 * Turn a 403 into a thrown Error carrying the `AUTHZ:<code>` sentinel, so screens
 * can use the same `authzErrorCode` / `describeAuthzError` pair everywhere
 * regardless of whether the failure came from the handshake or a business call.
 *
 * A read-only-OU write refusal deliberately has no code (its body must stay
 * byte-identical server-side), so its prose is thrown verbatim.
 */
export async function throwAccessDenied(
  response: Response,
  fallback: string
): Promise<never> {
  const denial = await readAccessDenial(response);
  if (denial?.code) {
    throw new Error(AUTHZ_ERROR_PREFIX + denial.code);
  }
  throw new Error(denial?.detail || fallback);
}

/** Re-exported so screens need only one import to render a denial. */
export { describeAuthzError };
export type { AuthzDenial };

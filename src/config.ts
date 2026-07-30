// API Configuration
// Switch between test and production servers by commenting/uncommenting the URLs below
// Updated testing 6

// Test/Development Server
//export const API_BASE_URL = 'http://127.0.0.1:8000';

// Production Server
export const API_BASE_URL = 'https://fastapi-fafyfgcmaqgsbncg.uksouth-01.azurewebsites.net';

// Azure Static Web App origin (Microsoft/Entra login + broker `mint-ms-token`).
// The broker's security comes from the SWA HttpOnly auth cookie flowing on a
// same-origin request from the auth BrowserWindow — this URL is NOT a secret and
// is safe to ship (see security notes in the auth flow). Swap for a custom domain
// here if one is configured later.
export const SWA_ORIGIN = 'https://red-mushroom-085f93603.2.azurestaticapps.net';

// The web access portal, hosted on the same SWA as the broker Function. It is the
// ONLY surface where registration and access requests work: every `/access/*`
// endpoint is gated at channel="any", so a tier-1 desktop token cannot reach them,
// and a brand-new account has no OU for a property approver to match on. The
// browser signs in against the SWA on its own — no token is ever handed across.
export const PORTAL_NAME = 'Atlas';
export const PORTAL_ACCOUNT_URL = `${SWA_ORIGIN}/go/account`;

// Entra `domain_hint` injected into the company sign-in flow. The SWA uses the
// managed ("simple") AAD provider, which can't set `loginParameterNames`, so we
// inject the hint client-side in the auth BrowserWindow (see MsBroker). With it,
// Entra Home Realm Discovery routes straight to Marriott SSO — skipping the
// Microsoft email-entry page AND the Windows Security passkey prompt. Set to an
// empty string to disable injection.
export const COMPANY_DOMAIN_HINT = 'marriott.com';

// Placeholder company email autofilled into the Microsoft sign-in box to force
// Entra Home Realm Discovery to redirect to Marriott SSO (Entra ignores
// `domain_hint` auto-acceleration, but submitting any `@marriott.com` address
// federates). The local part is arbitrary — Marriott SSO shows its own login.
// Set to an empty string to disable autofill (the WebAuthn/passkey suppression
// still applies, leaving a clean manual email→password flow).
export const COMPANY_SSO_LOGIN_HINT = 'a@marriott.com';

// Prefix used to encode broker-gate error CODES in an Error message so they can
// survive the IPC boundary (only `error.message` crosses). The renderer strips
// this prefix to branch broker failures (no_principal / domain_not_allowed / ...)
// apart from normal app failures (which carry the FastAPI `detail` text verbatim).
export const MS_BROKER_ERROR_PREFIX = 'MS_BROKER:';

// Same trick, for the server's authorization denial codes (app_access_not_granted,
// ou_access_pending, ...). These arrive as `{"error": <code>}` alongside the FastAPI
// `detail`, and the renderer needs the CODE — not the prose — to decide whether the
// user is waiting on a device (stay put) or on a permission (go to the portal).
// No space after the colon, so services/auth.ts's single envelope strip leaves it intact.
export const AUTHZ_ERROR_PREFIX = 'AUTHZ:';

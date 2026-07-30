/**
 * usePortalLink — the one place that knows how to reach the access portal.
 * -----------------------------------------------------------------------
 * Registration, access requests and anything else about a user's permissions
 * live in the browser portal, not here: every `/access/*` endpoint is gated so a
 * tier-1 desktop token cannot reach it, and a brand-new account has no property
 * for an approver to match on. Device registration stays in the app — the device
 * IS the install, which is the whole point of the second tier.
 *
 * No token crosses over. The browser signs in against the SWA on its own, which
 * is exactly what keeps the portal's trust anchor identical to the desktop's.
 */

import { useCallback, useState } from "react";
import { PORTAL_ACCOUNT_URL, PORTAL_NAME } from "../config";

export interface PortalLink {
  /** The URL, for display and for the copy button. */
  url: string;
  /** Product name of the portal, for copy ("the Atlas portal"). */
  name: string;
  /** Hand the URL to the OS default browser via main. */
  openInBrowser: () => Promise<void>;
  /** Copy the URL to the clipboard. */
  copy: () => Promise<void>;
  /** True for a few seconds after a successful copy. */
  copied: boolean;
  /** Set when openInBrowser failed — the copyable URL is then the fallback. */
  openError: string | null;
}

export function usePortalLink(url: string = PORTAL_ACCOUNT_URL): PortalLink {
  const [copied, setCopied] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const openInBrowser = useCallback(async () => {
    setOpenError(null);
    try {
      // Origin-locked in main (src/ipc/handlers/app.ts) — the renderer cannot
      // turn this into a general "open anything" primitive.
      await window.ipcApi.sendIpcRequest("app:open-external", url);
    } catch (err) {
      // The IPC error middleware prefixes messages with a machine code
      // ("INTERNAL_ERROR: ..."), so show fixed copy and log the real thing.
      console.error("Failed to open the portal in a browser:", err);
      setOpenError(
        "Couldn't open your browser automatically. Copy the link below and paste it into your browser."
      );
    }
  }, [url]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setOpenError("Could not copy the link. Select it and copy manually.");
    }
  }, [url]);

  return { url, name: PORTAL_NAME, openInBrowser, copy, copied, openError };
}

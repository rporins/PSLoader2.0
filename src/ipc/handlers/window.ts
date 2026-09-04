/**
 * Window IPC Handlers
 * Owns UI scaling via Electron's zoom factor. All scale logic lives in the main
 * process so it can measure a zoom-independent window size (avoiding the feedback
 * loop that would occur if the renderer measured its own zoomed viewport).
 */

import { BrowserWindow } from "electron";
import type { IpcHandler } from "../types";

type ScaleMode = "auto" | "manual";

// ── Tuning knobs ─────────────────────────────────────────────
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.0; // only ever scale down — never magnify the UI
// Window content width (DIP) at which auto ≈ 1.0. A large/maximized window on a
// 4k display (~3840) renders at 1.0; smaller windows scale down proportionally.
const REFERENCE_WIDTH = 3840;

// Current policy shared across the (single) app window. Updated by the renderer
// once settings load; defaults to native 1.0 (manual) so the pre-login screens
// render at full fidelity. A saved policy may switch it to auto or another factor.
let policy: { mode: ScaleMode; factor: number } = { mode: "manual", factor: 1 };

// Windows we've already wired resize/load listeners onto.
const wired = new WeakSet<BrowserWindow>();

// Debounce window for the resize recompute (ms). Dragging a window edge fires many
// resize events/sec; each setZoomFactor triggers a relayout, so we only re-zoom once
// the drag settles.
const RESIZE_DEBOUNCE_MS = 120;

// Zoom factors are floats; treat anything under this as "already correct".
const ZOOM_EPSILON = 0.001;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Why an apply was triggered. Only affects the change-guard and logging:
 *  - "policy"   — the user changed the scale, or auto recomputed for a new size.
 *                 A difference here is expected, not a fault.
 *  - "load"     — a page load may have dropped the zoom; reassert unconditionally.
 *  - "reassert" — a routine checkpoint (focus, restore, in-page navigation). A
 *                 difference here means something outside this module moved the
 *                 zoom, which is worth recording.
 */
type ApplyReason = "policy" | "load" | "reassert";

/** Derive a scale from the window's own content width (zoom-independent). */
function computeAutoFactor(win: BrowserWindow): number {
  const width = win.getContentBounds().width;
  const raw = 0.6 + 0.4 * (width / REFERENCE_WIDTH);
  return clamp(Math.round(raw * 100) / 100, MIN_ZOOM, MAX_ZOOM);
}

/**
 * Apply the effective factor to a window and return it.
 *
 * The change-guard compares against the zoom Chromium *actually* reports, never a
 * value cached here. Chromium owns this state and other paths can move it (a page
 * load, or any code calling setZoomFactor/zoomLevel); a local cache silently goes
 * stale and then suppresses the very call that would correct the drift — leaving the
 * UI stuck at the wrong scale with no way back short of changing the setting.
 * getZoomFactor() reads main-process state, so this stays a cheap comparison.
 */
function applyToWindow(win: BrowserWindow, reason: ApplyReason = "policy"): number {
  if (win.isDestroyed()) return 1;
  const factor =
    policy.mode === "auto" ? computeAutoFactor(win) : clamp(policy.factor, MIN_ZOOM, MAX_ZOOM);

  const current = win.webContents.getZoomFactor();
  const drifted = Math.abs(current - factor) > ZOOM_EPSILON;

  // Skip the relayout entirely when the zoom is already what it should be.
  if (reason === "load" || drifted) {
    if (reason === "reassert") {
      // Only reachable when something outside this module changed the zoom.
      console.warn(
        `[WARN ] UI scale drift corrected: zoom was ${current.toFixed(3)}, expected ${factor.toFixed(3)}.`
      );
    }
    win.webContents.setZoomFactor(factor);
  }

  // Disable pinch / visual zoom so the factor stays authoritative. Returns a promise
  // that rejects if the window goes away mid-call — swallow it rather than surfacing
  // an unhandled rejection during teardown.
  void win.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {
    /* window is gone; nothing to constrain */
  });
  return factor;
}

/**
 * Attach the UI-scale behaviour to a window (idempotent). In auto mode a resize
 * recomputes the scale — which also covers a user dragging the app to a different
 * monitor and resizing it there. The zoom factor can reset when a new page loads,
 * so we reassert it on every finished load.
 *
 * The remaining listeners are checkpoints, not triggers: each one asks "is the zoom
 * still what the user asked for?" and, thanks to the guard in applyToWindow, does
 * nothing at all unless it has drifted. Without them a drift is permanent, because
 * in manual mode nothing else re-applies until the setting itself changes.
 */
export function attachUiScale(win: BrowserWindow): void {
  if (wired.has(win)) return;
  wired.add(win);

  // Debounced recompute — coalesces the burst of resize events from an interactive
  // drag into a single re-zoom once the size settles.
  let resizeTimer: NodeJS.Timeout | null = null;
  const recompute = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      // In auto mode the target legitimately changes with the window size; in manual
      // mode the size is irrelevant and this is purely a drift checkpoint.
      applyToWindow(win, policy.mode === "auto" ? "policy" : "reassert");
    }, RESIZE_DEBOUNCE_MS);
  };
  win.on("resize", recompute);

  // A finished load may have reset the zoom to 1 — reassert unconditionally.
  win.webContents.on("did-finish-load", () => applyToWindow(win, "load"));

  // Checkpoints: returning to the app (alt-tab, or closing the native file dialog an
  // import opens), restoring from the taskbar, and hash-router navigation between
  // pages. These are the moments a user notices the scale, and they cost one float
  // comparison when nothing is wrong.
  win.on("focus", () => applyToWindow(win, "reassert"));
  win.on("restore", () => applyToWindow(win, "reassert"));
  win.webContents.on("did-navigate-in-page", () => applyToWindow(win, "reassert"));

  // Apply immediately for the current content (login / loading screens).
  applyToWindow(win, "policy");
}

/**
 * Create window-related IPC handlers.
 */
export function createWindowHandlers(): Record<string, IpcHandler> {
  return {
    "window:set-ui-scale": async (
      event,
      req: { mode: ScaleMode; factor?: number }
    ) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return { applied: false };

      policy = {
        mode: req?.mode === "manual" ? "manual" : "auto",
        factor: clamp(Number(req?.factor) || 1, MIN_ZOOM, MAX_ZOOM),
      };

      attachUiScale(win); // idempotent — also ensures resize listeners exist
      const effectiveFactor = applyToWindow(win, "policy");
      return { applied: true, effectiveFactor };
    },
  };
}

/**
 * SessionGate — the app entry ("/").
 * -----------------------------------------------------------
 * Decides where a launching/returning user lands, so a valid session-holder is
 * NEVER forced back through the Microsoft entrance. The broker gate is only for
 * minting a NEW session (login/register); resume is device/refresh-token based
 * and Microsoft-free.
 *
 * Routing (in priority order):
 *   - Signed in (Level 2, device-verified)         -> straight into the app.
 *   - Resume in flight (token MIGHT be valid)      -> optimistic "restoring"
 *     splash with a "Sign in instead" escape hatch (never a hard freeze). The
 *     fast LOCAL pre-check means a provably-dead token skips this entirely.
 *   - No resumable session (or resume finished unauthenticated) -> Landing with
 *     the Microsoft entrance.
 */

import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import authService from "../services/auth";
import { useAuthStatus } from "../hooks/useAuthStatus";
import { useThemeMode } from "../store/settings";
import Landing from "./landing";
import "../styles/auth.css";

/** Reveal the "Sign in instead" escape hatch after this long (ms). */
const ESCAPE_HATCH_DELAY_MS = 2500;

/**
 * Resume has no per-step events from main (it is one refresh round-trip), so
 * unlike the device screen these steps are paced rather than reported: each
 * lights after this long, and the last one stays active until the gate routes
 * away. The cadence is deliberately slower than a typical resume, so the bar
 * never claims "Ready" before the app actually opens.
 */
const STEP_INTERVAL_MS = 900;

const RESUME_STEPS = [
  { id: "restore", label: "Restoring" },
  { id: "verify", label: "Verifying" },
  { id: "ready", label: "Ready" },
];

const RestoringSplash: React.FC<{
  onSignInInstead: () => void;
  email?: string | null;
}> = ({ onSignInInstead, email }) => {
  const isDark = useThemeMode() === "dark";
  const [showEscape, setShowEscape] = useState(false);
  const [lit, setLit] = useState(1); // how many steps are lit (first is immediate)

  useEffect(() => {
    const escape = setTimeout(() => setShowEscape(true), ESCAPE_HATCH_DELAY_MS);
    const tick = setInterval(
      () => setLit((n) => Math.min(n + 1, RESUME_STEPS.length)),
      STEP_INTERVAL_MS
    );
    return () => {
      clearTimeout(escape);
      clearInterval(tick);
    };
  }, []);

  // Only settled steps fill the bar; the currently-active one is still running.
  const progress = Math.round(((lit - 1) / RESUME_STEPS.length) * 100);

  return (
    <div
      className={`auth-container${isDark ? " theme-dark" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="auth-card device-verify">
        <div className="device-icon verifying">
          <div className="device-animation">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="device-shield">
              <path d="M40 10L15 22v20c0 13.255 10.745 28 25 28s25-14.745 25-28V22L40 10z"
                    stroke="url(#resumeGradient)" strokeWidth="2" fill="none" opacity="0.3"/>
              <path d="M30 40l8 8 16-16" stroke="url(#resumeGradient)" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="resumeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary-blue)" />
                  <stop offset="100%" stopColor="var(--primary-purple)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="pulse-ring" />
          </div>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">
          {email ? `Restoring your session as ${email}…` : "Restoring your session…"}
        </p>

        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-steps">
            {RESUME_STEPS.map((step, i) => (
              <div key={step.id} className={`step ${i < lit ? "active" : ""}`}>
                <span className="step-dot" />
                <span className="step-label">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {showEscape && (
          <button
            onClick={onSignInInstead}
            className="link"
            style={{
              marginTop: "20px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Sign in instead
          </button>
        )}
      </div>
    </div>
  );
};

const SessionGate: React.FC = () => {
  const { status, resumable } = useAuthStatus();
  const resolved = authService.isResumeResolved();
  const [bailed, setBailed] = useState(false);

  // Signed in this run (device-verified) -> straight into the app.
  if (status.securityLevel >= 2) {
    return <Navigate to="/signed-in-landing/home" replace />;
  }

  // Resume still in flight and the user hasn't bailed -> optimistic splash.
  if (resumable && !resolved && !bailed) {
    return (
      <RestoringSplash
        onSignInInstead={() => setBailed(true)}
        email={status.lastUserEmail}
      />
    );
  }

  // No resumable session, resume failed, or the user chose to sign in now.
  return <Landing />;
};

export default SessionGate;

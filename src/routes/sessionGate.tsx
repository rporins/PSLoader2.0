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
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha, keyframes, useTheme } from "@mui/material/styles";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import authService from "../services/auth";
import { useAuthStatus } from "../hooks/useAuthStatus";
import Landing from "./landing";

/** Reveal the "Sign in instead" escape hatch after this long (ms). */
const ESCAPE_HATCH_DELAY_MS = 2500;

// Same visual language as the device-verify screen — a pulsing shield inside a
// rippling ring, with stepped progress dots — so the resume splash reads as a
// sibling of the security screens rather than a bare spinner.
const ripple = keyframes`
  0% { transform: scale(0.85); opacity: 0.7; }
  100% { transform: scale(1.7); opacity: 0; }
`;

const softPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
`;

const dotWave = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.25); }
`;

const RESUME_STEPS = ["Restoring", "Verifying", "Ready"];

const RestoringSplash: React.FC<{
  onSignInInstead: () => void;
  email?: string | null;
}> = ({ onSignInInstead, email }) => {
  const theme = useTheme();
  const [showEscape, setShowEscape] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowEscape(true), ESCAPE_HATCH_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        height: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
      }}
    >
      <Stack alignItems="center" spacing={3} sx={{ px: 3, textAlign: "center" }}>
        {/* Pulsing shield in a rippling ring */}
        <Box
          sx={{
            position: "relative",
            width: 112,
            height: 112,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2px solid ${alpha("#8b5cf6", 0.5)}`,
              animation: `${ripple} 2s ease-out infinite`,
            }}
          />
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: `linear-gradient(135deg, #667eea, #764ba2)`,
              boxShadow: `0 20px 40px ${alpha("#764ba2", 0.4)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: `${softPulse} 2s ease-in-out infinite`,
            }}
          >
            <ShieldRoundedIcon sx={{ color: "#ffffff", fontSize: 34 }} />
          </Box>
        </Box>

        <Stack spacing={0.5} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.3 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {email ? `Restoring your session as ${email}…` : "Restoring your session…"}
          </Typography>
        </Stack>

        {/* Stepped progress dots */}
        <Stack direction="row" spacing={4} sx={{ mt: 0.5 }}>
          {RESUME_STEPS.map((label, i) => (
            <Stack key={label} spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, #667eea, #764ba2)`,
                  animation: `${dotWave} 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
              >
                {label}
              </Typography>
            </Stack>
          ))}
        </Stack>

        {showEscape && (
          <Button
            variant="text"
            size="small"
            onClick={onSignInInstead}
            sx={{ textTransform: "none", mt: 1 }}
          >
            Sign in instead
          </Button>
        )}
      </Stack>
    </Box>
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

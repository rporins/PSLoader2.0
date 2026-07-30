// Register.tsx — hand-off to the web access portal
// ---------------------------------------------------------------------------------
// Registration does NOT happen in the desktop app any more.
//
// Two facts force it into the browser. A brand-new account holds no property, so
// no local approver can decide its device — only an administrator can, which put
// every new starter behind the smallest group in the company. And the whole
// request surface (`/access/*`) is gated above the tier a freshly-signed-in
// desktop client holds, so the app literally cannot submit an access request.
// The portal has neither problem: it needs only a broker token.
//
// The device stays here. The device IS the install, which is the entire point of
// the second tier — this screen is only about who the user is and what they may
// see.
// ---------------------------------------------------------------------------------

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Alert,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, styled, useTheme, keyframes } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { usePortalLink } from "../hooks/usePortalLink";

// ────────────────────────────────────────────────────────────
// ANIMATIONS
// ────────────────────────────────────────────────────────────

const liquidMorph = keyframes`
  0%, 100% {
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    transform: rotate(0deg) scale(1);
  }
  25% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
    transform: rotate(90deg) scale(1.05);
  }
  50% {
    border-radius: 50% 50% 50% 50% / 60% 40% 60% 40%;
    transform: rotate(180deg) scale(0.95);
  }
  75% {
    border-radius: 40% 60% 30% 70% / 70% 30% 60% 40%;
    transform: rotate(270deg) scale(1.02);
  }
`;

const chromaticWave = keyframes`
  0% {
    background-position: 0% 50%;
    filter: hue-rotate(0deg);
  }
  50% {
    background-position: 100% 50%;
    filter: hue-rotate(30deg);
  }
  100% {
    background-position: 0% 50%;
    filter: hue-rotate(0deg);
  }
`;

// ────────────────────────────────────────────────────────────
// STYLED COMPONENTS
// ────────────────────────────────────────────────────────────

const PageRoot = styled("div")(({ theme }) => ({
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  perspective: "2000px",
  transformStyle: "preserve-3d",

  background: theme.palette.mode === "dark"
    ? `radial-gradient(ellipse at top left, #1a1b3a 0%, #090a1f 25%, #000511 50%, #090a1f 75%, #1a1b3a 100%)`
    : `radial-gradient(ellipse at top left, #f0f4ff 0%, #e8ecff 25%, #dce2ff 50%, #e8ecff 75%, #f0f4ff 100%)`,

  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: `conic-gradient(from 180deg at 50% 50%,
      ${alpha("#ff00ff", 0.03)},
      ${alpha("#00ffff", 0.03)},
      ${alpha("#ffff00", 0.03)},
      ${alpha("#ff00ff", 0.03)})`,
    backgroundSize: "400% 400%",
    animation: `${chromaticWave} 20s ease-in-out infinite`,
    mixBlendMode: theme.palette.mode === "dark" ? "screen" : "multiply",
    pointerEvents: "none",
  },
}));

const LiquidMetalOrbs = styled("div")<{ $reduceMotion: boolean }>(({ theme, $reduceMotion }) => ({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",

  ".metal-orb": {
    position: "absolute",
    background: theme.palette.mode === "dark"
      ? `radial-gradient(circle at 30% 30%,
          ${alpha("#ffffff", 0.8)},
          ${alpha("#8b5cf6", 0.4)},
          ${alpha("#06b6d4", 0.3)},
          ${alpha("#000000", 0.2)})`
      : `radial-gradient(circle at 30% 30%,
          ${alpha("#ffffff", 0.9)},
          ${alpha("#8b5cf6", 0.3)},
          ${alpha("#06b6d4", 0.2)},
          ${alpha("#000000", 0.1)})`,
    filter: "blur(40px) contrast(1.5)",
    animation: $reduceMotion ? "none" : `${liquidMorph} 18s ease-in-out infinite`,
    willChange: "transform, border-radius",
  },

  ".orb1": {
    width: 500,
    height: 500,
    top: "-15%",
    left: "-10%",
    animationDelay: "0s",
  },
  ".orb2": {
    width: 400,
    height: 400,
    bottom: "-10%",
    right: "-8%",
    animationDelay: "-6s",
    animationDuration: "20s",
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 480,
  borderRadius: 32,
  position: "relative",
  overflow: "visible",
  backdropFilter: "blur(40px) saturate(200%)",
  background: theme.palette.mode === "dark"
    ? `linear-gradient(135deg,
        ${alpha("#ffffff", 0.08)} 0%,
        ${alpha("#ffffff", 0.03)} 40%,
        ${alpha("#8b5cf6", 0.05)} 100%)`
    : `linear-gradient(135deg,
        ${alpha("#ffffff", 0.95)} 0%,
        ${alpha("#ffffff", 0.85)} 40%,
        ${alpha("#8b5cf6", 0.08)} 100%)`,

  border: `1px solid ${alpha("#ffffff", theme.palette.mode === "dark" ? 0.15 : 0.25)}`,

  boxShadow: theme.palette.mode === "dark"
    ? `0 50px 100px -20px rgba(139, 92, 246, 0.25),
       0 30px 60px -30px rgba(6, 182, 212, 0.3),
       inset 0 1px 0 rgba(255, 255, 255, 0.1),
       inset 0 -1px 0 rgba(0, 0, 0, 0.2)`
    : `0 50px 100px -20px rgba(139, 92, 246, 0.15),
       0 30px 60px -30px rgba(6, 182, 212, 0.2),
       inset 0 1px 0 rgba(255, 255, 255, 0.9)`,
}));

const PremiumButton = styled(Button)(({ theme }) => ({
  borderRadius: 18,
  textTransform: "none",
  fontWeight: 700,
  fontSize: "1rem",
  letterSpacing: 0.3,
  padding: "16px 32px",
  position: "relative",
  overflow: "hidden",
  background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
  boxShadow: `0 20px 40px -10px rgba(103, 126, 234, 0.35)`,
  transform: "translateZ(0)",
  transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",

  "&:hover": {
    transform: "translateY(-2px) scale(1.02)",
    boxShadow: `0 25px 50px -10px rgba(103, 126, 234, 0.45)`,
    background: `linear-gradient(135deg, #764ba2 0%, #667eea 100%)`,
  },

  "&:active": {
    transform: "translateY(0) scale(0.98)",
  },

  "&:disabled": {
    background: alpha(theme.palette.action.disabled, 0.12),
    color: alpha(theme.palette.text.primary, 0.26),
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  borderRadius: 18,
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.95rem",
  padding: "14px 28px",
  border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
  backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.1 : 0.5),
  backdropFilter: "blur(10px)",
  transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",

  "&:hover": {
    borderColor: alpha(theme.palette.primary.main, 0.5),
    backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.18 : 0.7),
  },
}));

const BackButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: 20,
  left: 20,
  backgroundColor: alpha(theme.palette.background.paper, 0.1),
  backdropFilter: "blur(10px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  transition: "all 0.3s",

  "&:hover": {
    backgroundColor: alpha(theme.palette.background.paper, 0.2),
    transform: "translateX(-4px)",
  },
}));

const UrlBox = styled("div")(({ theme }) => ({
  padding: "12px 14px",
  borderRadius: 14,
  fontFamily: "monospace",
  fontSize: 13,
  wordBreak: "break-all",
  textAlign: "left",
  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
  backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.12 : 0.55),
}));

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate();
  const theme = useTheme();
  const portal = usePortalLink();

  return (
    <PageRoot>
      {/* Liquid metal morphing background */}
      <LiquidMetalOrbs $reduceMotion={false}>
        <div className="metal-orb orb1" />
        <div className="metal-orb orb2" />
      </LiquidMetalOrbs>

      {/* Back button */}
      <BackButton onClick={() => navigate("/")} aria-label="Go back">
        <ArrowBackIcon />
      </BackButton>

      {/* Main content */}
      <Box sx={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480, px: 2 }}>
        <StyledCard elevation={0}>
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "20%",
                  background: `linear-gradient(135deg, #667eea, #764ba2)`,
                  boxShadow: `0 20px 40px rgba(118,75,162,0.4)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <PersonAddAltRoundedIcon sx={{ color: "#ffffff", fontSize: 28 }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: "2rem",
                  lineHeight: 1.1,
                  mb: 1,
                  background:
                    theme.palette.mode === "dark"
                      ? `linear-gradient(135deg, #ffffff, #c9b8ff)`
                      : `linear-gradient(135deg, #1a1a2e, #764ba2)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Register in the {portal.name} portal
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  opacity: 0.85,
                  fontSize: "0.875rem",
                }}
              >
                Accounts, hotel access and request status all live there
              </Typography>
            </Box>

            <Stack spacing={3}>
              <Typography
                variant="body2"
                sx={{ textAlign: "center", color: theme.palette.text.secondary }}
              >
                Sign in there with the same Marriott SSO account you use here, then
                request the hotels and reports you work on. Once your access is
                granted, come back and sign in — this app will register and verify
                this device itself.
              </Typography>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8 }}>
                  Portal link
                </Typography>
                <UrlBox>{portal.url}</UrlBox>
              </Box>

              {portal.openError && (
                <Alert severity="warning" sx={{ borderRadius: 3 }}>
                  {portal.openError}
                </Alert>
              )}

              <PremiumButton
                fullWidth
                size="large"
                startIcon={<OpenInNewRoundedIcon />}
                onClick={portal.openInBrowser}
                sx={{ color: "white" }}
              >
                Open in my browser
              </PremiumButton>

              <SecondaryButton
                fullWidth
                size="large"
                startIcon={<ContentCopyRoundedIcon />}
                onClick={portal.copy}
              >
                {portal.copied ? "Link copied" : "Copy link instead"}
              </SecondaryButton>
            </Stack>

            {/* Sign in link */}
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Already have access?{" "}
                <Button
                  onClick={() => navigate("/login")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    p: 0,
                    minWidth: "auto",
                    "&:hover": {
                      background: "transparent",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Sign in
                </Button>
              </Typography>
            </Box>
          </CardContent>
        </StyledCard>
      </Box>
    </PageRoot>
  );
}

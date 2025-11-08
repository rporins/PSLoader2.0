// Register.tsx — Modern Registration Form
// ---------------------------------------------------------------------------------
// Purpose: User registration with clean, modern design
// API: POST https://fastapi-fafyfgcmaqgsbncg.uksouth-01.azurewebsites.net/auth/register
// ---------------------------------------------------------------------------------

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, styled, useTheme, keyframes } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

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

const successPulse = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
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

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 16,
    backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.1 : 0.5),
    backdropFilter: "blur(10px)",
    transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",

    "&:hover": {
      backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.15 : 0.6),
    },

    "&.Mui-focused": {
      backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.2 : 0.7),
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: alpha(theme.palette.divider, 0.3),
    transition: "border-color 0.3s",
  },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: alpha(theme.palette.primary.main, 0.4),
  },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
  },
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

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface ApiError {
  detail?: string;
  message?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const theme = useTheme();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: keyof RegisterFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: event.target.value });
    // Clear validation error for this field
    setValidationErrors({ ...validationErrors, [field]: undefined });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://fastapi-fafyfgcmaqgsbncg.uksouth-01.azurewebsites.net/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(
          errorData.detail || errorData.message || "Registration failed"
        );
      }

      const userData = await response.json();
      console.log("Registration successful:", userData);

      setSuccess(true);

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageRoot>
      {/* Liquid metal morphing background */}
      <LiquidMetalOrbs $reduceMotion={!!reduceMotion}>
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
            {success ? (
              // Success state
              <Stack alignItems="center" spacing={3} sx={{ py: 4 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, #10b981, #059669)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: `${successPulse} 0.6s ease-out`,
                    boxShadow: `0 20px 40px rgba(16, 185, 129, 0.3)`,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 48, color: "#ffffff" }} />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    background: `linear-gradient(135deg, #10b981, #059669)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Registration Successful!
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  align="center"
                >
                  Your account has been created. Redirecting to sign in...
                </Typography>
              </Stack>
            ) : (
              // Registration form
              <>
                {/* Header */}
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
                    Create Account
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      opacity: 0.8,
                      fontSize: "0.875rem",
                    }}
                  >
                    Create your account to get started
                  </Typography>
                </Box>

                {/* Error alert */}
                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 4,
                      background: alpha("#ef4444", 0.08),
                      border: `1px solid ${alpha("#ef4444", 0.2)}`,
                      backdropFilter: "blur(10px)",
                    }}
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    {/* Email field */}
                    <StyledTextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={handleChange("email")}
                      error={!!validationErrors.email}
                      helperText={validationErrors.email}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Password field */}
                    <StyledTextField
                      fullWidth
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange("password")}
                      error={!!validationErrors.password}
                      helperText={validationErrors.password || "Minimum 8 characters"}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Confirm password field */}
                    <StyledTextField
                      fullWidth
                      label="Confirm Password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange("confirmPassword")}
                      error={!!validationErrors.confirmPassword}
                      helperText={validationErrors.confirmPassword}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              size="small"
                            >
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Submit button */}
                    <PremiumButton
                      fullWidth
                      type="submit"
                      size="large"
                      disabled={loading}
                      sx={{ mt: 2, color: "white" }}
                    >
                      {loading ? (
                        <CircularProgress size={24} sx={{ color: "white" }} />
                      ) : (
                        "Create Account"
                      )}
                    </PremiumButton>
                  </Stack>
                </form>

                {/* Sign in link */}
                <Box sx={{ textAlign: "center", mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{" "}
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
              </>
            )}
          </CardContent>
        </StyledCard>
      </Box>
    </PageRoot>
  );
}

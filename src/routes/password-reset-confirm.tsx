import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  alpha,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled, useTheme, keyframes } from '@mui/material/styles';
import LockResetIcon from '@mui/icons-material/LockReset';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockIcon from '@mui/icons-material/Lock';
import DevicesIcon from '@mui/icons-material/Devices';

// Animations
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

const hologramPulse = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1) translateY(0); }
  50% { opacity: 0.6; transform: scale(1.02) translateY(-2px); }
`;

const checkmarkAnimation = keyframes`
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
`;

// Styled Components
const PageRoot = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  perspective: '2000px',
  transformStyle: 'preserve-3d',

  background: theme.palette.mode === 'dark'
    ? `radial-gradient(ellipse at top left, #1a1b3a 0%, #090a1f 25%, #000511 50%, #090a1f 75%, #1a1b3a 100%)`
    : `radial-gradient(ellipse at top left, #f0f4ff 0%, #e8ecff 25%, #dce2ff 50%, #e8ecff 75%, #f0f4ff 100%)`,

  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: `conic-gradient(from 180deg at 50% 50%,
      ${alpha('#ff00ff', 0.03)},
      ${alpha('#00ffff', 0.03)},
      ${alpha('#ffff00', 0.03)},
      ${alpha('#ff00ff', 0.03)})`,
    backgroundSize: '400% 400%',
    animation: `${chromaticWave} 20s ease-in-out infinite`,
    mixBlendMode: theme.palette.mode === 'dark' ? 'screen' : 'multiply',
    pointerEvents: 'none',
  },
}));

const LiquidMetalOrbs = styled('div')<{ $reduceMotion: boolean }>(({ theme, $reduceMotion }) => ({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',

  '.metal-orb': {
    position: 'absolute',
    background: theme.palette.mode === 'dark'
      ? `radial-gradient(circle at 30% 30%,
          ${alpha('#ffffff', 0.8)},
          ${alpha('#8b5cf6', 0.4)},
          ${alpha('#06b6d4', 0.3)},
          ${alpha('#000000', 0.2)})`
      : `radial-gradient(circle at 30% 30%,
          ${alpha('#ffffff', 0.9)},
          ${alpha('#8b5cf6', 0.3)},
          ${alpha('#06b6d4', 0.2)},
          ${alpha('#000000', 0.1)})`,
    filter: 'blur(40px) contrast(1.5)',
    animation: $reduceMotion ? 'none' : `${liquidMorph} 18s ease-in-out infinite`,
    willChange: 'transform, border-radius',
  },

  '.orb1': {
    width: 500,
    height: 500,
    top: '-15%',
    left: '-10%',
    animationDelay: '0s',
  },
  '.orb2': {
    width: 400,
    height: 400,
    bottom: '-10%',
    right: '-8%',
    animationDelay: '-6s',
    animationDuration: '20s',
  },
  '.orb3': {
    width: 350,
    height: 350,
    top: '35%',
    right: '10%',
    animationDelay: '-12s',
    animationDuration: '16s',
  },
}));

const HolographicCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 520,
  borderRadius: 32,
  position: 'relative',
  overflow: 'visible',
  backdropFilter: 'blur(40px) saturate(200%)',
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg,
        ${alpha('#ffffff', 0.08)} 0%,
        ${alpha('#ffffff', 0.03)} 40%,
        ${alpha('#8b5cf6', 0.05)} 100%)`
    : `linear-gradient(135deg,
        ${alpha('#ffffff', 0.95)} 0%,
        ${alpha('#ffffff', 0.85)} 40%,
        ${alpha('#8b5cf6', 0.08)} 100%)`,

  border: `1px solid ${alpha('#ffffff', theme.palette.mode === 'dark' ? 0.15 : 0.25)}`,

  boxShadow: theme.palette.mode === 'dark'
    ? `0 50px 100px -20px rgba(139, 92, 246, 0.25),
       0 30px 60px -30px rgba(6, 182, 212, 0.3),
       inset 0 1px 0 rgba(255, 255, 255, 0.1),
       inset 0 -1px 0 rgba(0, 0, 0, 0.2)`
    : `0 50px 100px -20px rgba(139, 92, 246, 0.15),
       0 30px 60px -30px rgba(6, 182, 212, 0.2),
       inset 0 1px 0 rgba(255, 255, 255, 0.9)`,

  transformStyle: 'preserve-3d',
  transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',

  '&:hover': {
    transform: 'translateY(-4px) rotateX(2deg)',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 60px 120px -20px rgba(139, 92, 246, 0.35),
         0 40px 80px -30px rgba(6, 182, 212, 0.4),
         inset 0 1px 0 rgba(255, 255, 255, 0.15)`
      : `0 60px 120px -20px rgba(139, 92, 246, 0.25),
         0 40px 80px -30px rgba(6, 182, 212, 0.3)`,
  },

  '&::before': {
    content: '""',
    position: 'absolute',
    inset: -2,
    borderRadius: 32,
    padding: 2,
    background: `linear-gradient(45deg,
      ${alpha('#ff00ff', 0.3)},
      ${alpha('#00ffff', 0.3)},
      ${alpha('#ffff00', 0.3)},
      ${alpha('#ff00ff', 0.3)})`,
    backgroundSize: '300% 300%',
    animation: `${chromaticWave} 8s ease-in-out infinite`,
    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    opacity: theme.palette.mode === 'dark' ? 0.6 : 0.3,
    pointerEvents: 'none',
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    inset: -50,
    background: `radial-gradient(circle at 50% 50%,
      ${alpha('#8b5cf6', 0.1)} 0%,
      transparent 70%)`,
    animation: `${hologramPulse} 4s ease-in-out infinite`,
    pointerEvents: 'none',
    zIndex: -1,
  },
}));

const PremiumButton = styled(Button)(({ theme }) => ({
  borderRadius: 18,
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '1rem',
  letterSpacing: 0.3,
  padding: '16px 32px',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
  boxShadow: `0 20px 40px -10px rgba(103, 126, 234, 0.35)`,
  transform: 'translateZ(0)',
  transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
  color: 'white',

  '&:hover': {
    transform: 'translateY(-2px) scale(1.02)',
    boxShadow: `0 25px 50px -10px rgba(103, 126, 234, 0.45)`,
    background: `linear-gradient(135deg, #764ba2 0%, #667eea 100%)`,
  },

  '&:active': {
    transform: 'translateY(0) scale(0.98)',
  },

  '&::before': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: `linear-gradient(45deg,
      transparent,
      ${alpha('#ffffff', 0.3)},
      transparent)`,
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s',
  },

  '&:hover::before': {
    transform: 'translateX(100%)',
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  borderRadius: 18,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  letterSpacing: 0.3,
  padding: '14px 28px',
  position: 'relative',
  background: alpha(theme.palette.primary.main, 0.08),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',

  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.12),
    borderColor: alpha(theme.palette.primary.main, 0.3),
    transform: 'translateY(-1px)',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 16,
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha('#ffffff', 0.05)
      : alpha('#000000', 0.03),
    transition: 'all 0.3s ease',

    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark'
        ? alpha('#ffffff', 0.08)
        : alpha('#000000', 0.05),
    },

    '&.Mui-focused': {
      backgroundColor: theme.palette.mode === 'dark'
        ? alpha('#ffffff', 0.08)
        : '#ffffff',
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  },

  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: alpha(theme.palette.divider, 0.1),
  },

  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
}));

const BackButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 20,
  left: 20,
  backgroundColor: alpha(theme.palette.background.paper, 0.1),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  transition: 'all 0.3s',

  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.2),
    transform: 'translateX(-4px)',
  },
}));

const PasswordResetConfirm: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Check if device is registered
    const id = authService.getDeviceId();
    setDeviceId(id);

    if (!id) {
      setError('No registered device found. You must use a registered device to reset your password.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Validate token format (43 chars, URL-safe base64)
    if (token.length !== 43) {
      setError('Invalid reset token format. Token should be 43 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.confirmPasswordReset(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset confirm error:', err);

      // Handle specific error messages
      const errorMsg = err.message || 'Failed to reset password';

      if (errorMsg.includes('Invalid or expired reset token')) {
        setError('This reset token is invalid or has expired. Please request a new one.');
      } else if (errorMsg.includes('Reset token has expired')) {
        setError('This reset token has expired (tokens expire after 30 minutes). Please request a new one.');
      } else if (errorMsg.includes('Invalid device credentials')) {
        setError('You must use the device you originally registered with to reset your password.');
      } else if (errorMsg.includes('Device does not belong to this user')) {
        setError('This device is not associated with your account. Please contact support.');
      } else if (errorMsg.includes('Device is not approved')) {
        setError('Your device is pending approval. Please wait for admin approval before resetting your password.');
      } else if (errorMsg.includes('No registered device found')) {
        setError('No registered device found. You must use a registered device to reset your password.');
      } else {
        setError(errorMsg);
      }

      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <PageRoot>
        <LiquidMetalOrbs $reduceMotion={false}>
          <div className="metal-orb orb1" />
          <div className="metal-orb orb2" />
          <div className="metal-orb orb3" />
        </LiquidMetalOrbs>

        <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, px: 2 }}>
          <HolographicCard elevation={0}>
            <CardContent sx={{ p: 5 }}>
              <Stack spacing={3} alignItems="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, #10b981, #059669)`,
                    boxShadow: `0 20px 40px rgba(16, 185, 129, 0.4)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: `${checkmarkAnimation} 0.6s cubic-bezier(0.23, 1, 0.32, 1)`,
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#ffffff', fontSize: 48 }} />
                </Box>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    fontSize: '2rem',
                    lineHeight: 1.2,
                    textAlign: 'center',
                    background: theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, #ffffff, #c9b8ff)`
                      : `linear-gradient(135deg, #1a1a2e, #764ba2)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Password Reset Successful
                </Typography>

                <Alert
                  severity="success"
                  sx={{
                    width: '100%',
                    borderRadius: 3,
                    background: alpha('#10b981', 0.08),
                    border: `1px solid ${alpha('#10b981', 0.2)}`,
                    backdropFilter: 'blur(10px)',
                    '& .MuiAlert-icon': {
                      color: '#10b981',
                    },
                  }}
                >
                  Your password has been reset successfully. You can now log in with your new password.
                </Alert>

                <PremiumButton
                  fullWidth
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Continue to Login
                </PremiumButton>
              </Stack>
            </CardContent>
          </HolographicCard>
        </Box>
      </PageRoot>
    );
  }

  return (
    <PageRoot>
      <LiquidMetalOrbs $reduceMotion={false}>
        <div className="metal-orb orb1" />
        <div className="metal-orb orb2" />
        <div className="metal-orb orb3" />
      </LiquidMetalOrbs>

      <BackButton onClick={() => navigate('/auth/password-reset/request')} aria-label="Go back">
        <ArrowBackIcon />
      </BackButton>

      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, px: 2 }}>
        <HolographicCard elevation={0}>
          <CardContent sx={{ p: 5 }}>
            <Stack spacing={2} alignItems="center" sx={{ mb: 4 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, #667eea, #764ba2)`,
                  boxShadow: `0 20px 40px rgba(118,75,162,0.4)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LockResetIcon sx={{ color: '#ffffff', fontSize: 28 }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: '2.2rem',
                  lineHeight: 1.1,
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, #ffffff, #c9b8ff)`
                    : `linear-gradient(135deg, #1a1a2e, #764ba2)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Set New Password
              </Typography>
            </Stack>

            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.secondary,
                  opacity: 0.9,
                  fontSize: '1.05rem',
                  fontWeight: 500,
                }}
              >
                Enter the token from your email
              </Typography>
            </Box>

            {/* Device Status */}
            {deviceId && (
              <Alert
                severity="info"
                icon={<DevicesIcon />}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  background: alpha(theme.palette.info.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  backdropFilter: 'blur(10px)',
                  '& .MuiAlert-icon': {
                    color: theme.palette.info.main,
                  },
                }}
              >
                Device registered: <strong>{deviceId.substring(0, 13)}...</strong>
              </Alert>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 4,
                  background: alpha('#ef4444', 0.08),
                  border: `1px solid ${alpha('#ef4444', 0.2)}`,
                  backdropFilter: 'blur(10px)',
                  '& .MuiAlert-icon': {
                    color: '#ef4444',
                  },
                }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <StyledTextField
                  fullWidth
                  label="Reset Token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.trim())}
                  required
                  disabled={isLoading || !deviceId}
                  autoComplete="off"
                  autoFocus
                  placeholder="Paste token from email (43 characters)"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKeyIcon sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                  helperText={`Token length: ${token.length}/43`}
                />

                <StyledTextField
                  fullWidth
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading || !deviceId}
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Minimum 8 characters"
                />

                <StyledTextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading || !deviceId}
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <PremiumButton
                  fullWidth
                  size="large"
                  type="submit"
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockResetIcon />}
                  disabled={isLoading || !deviceId}
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </PremiumButton>

                <SecondaryButton
                  fullWidth
                  size="large"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/auth/password-reset/request')}
                  disabled={isLoading}
                >
                  Request New Token
                </SecondaryButton>
              </Stack>
            </form>
          </CardContent>
        </HolographicCard>
      </Box>
    </PageRoot>
  );
};

export default PasswordResetConfirm;

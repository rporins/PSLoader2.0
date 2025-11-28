import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Stack,
  Button,
  Alert,
  alpha,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

const UpdateDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 24,
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg,
          ${alpha('#ffffff', 0.08)} 0%,
          ${alpha('#ffffff', 0.03)} 40%,
          ${alpha('#8b5cf6', 0.05)} 100%)`
      : `linear-gradient(135deg,
          ${alpha('#ffffff', 0.95)} 0%,
          ${alpha('#ffffff', 0.85)} 40%,
          ${alpha('#8b5cf6', 0.08)} 100%)`,
    backdropFilter: 'blur(40px)',
    border: `1px solid ${alpha('#ffffff', theme.palette.mode === 'dark' ? 0.15 : 0.25)}`,
    boxShadow: theme.palette.mode === 'dark'
      ? `0 50px 100px -20px rgba(139, 92, 246, 0.25),
         0 30px 60px -30px rgba(6, 182, 212, 0.3)`
      : `0 50px 100px -20px rgba(139, 92, 246, 0.15),
         0 30px 60px -30px rgba(6, 182, 212, 0.2)`,
  },
}));

interface UpdateCheckerProps {
  onUpdateComplete: () => void;
}

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

const UpdateChecker: React.FC<UpdateCheckerProps> = ({ onUpdateComplete }) => {
  const [checking, setChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    console.log('[UpdateChecker] Starting update check');

    if (!window.ipcApi) {
      console.log('[UpdateChecker] IPC API not available, skipping');
      setTimeout(() => onUpdateComplete(), 100);
      return;
    }

    console.log('[UpdateChecker] Registering event listeners');

    // Listen for update events from main process
    const handleUpdateAvailable = (_event: any, info: UpdateInfo) => {
      console.log('[UpdateChecker] Update available:', info);
      setUpdateAvailable(true);
      setUpdateInfo(info);
      setChecking(false);

      // Auto-download the update
      console.log('[UpdateChecker] Triggering download');
      window.ipcApi!.sendIpcRequest('app:download-update').catch((err: any) => {
        console.error('[UpdateChecker] Download failed:', err);
        setError(err.message || 'Failed to download update');
      });
    };

    const handleUpdateNotAvailable = () => {
      console.log('[UpdateChecker] No updates available, continuing to app');
      setChecking(false);
      // Close dialog and continue to login
      setTimeout(() => {
        onUpdateComplete();
      }, 500);
    };

    const handleDownloadProgress = (_event: any, progressInfo: any) => {
      console.log('[UpdateChecker] Download progress:', progressInfo.percent);
      setDownloading(true);
      setDownloadProgress(progressInfo.percent || 0);
    };

    const handleUpdateDownloaded = () => {
      console.log('[UpdateChecker] Update downloaded, preparing install');
      setDownloading(false);
      setInstalling(true);

      // Auto-install the update (will quit and restart the app)
      setTimeout(() => {
        console.log('[UpdateChecker] Triggering install');
        window.ipcApi!.sendIpcRequest('app:install-update').catch((err: any) => {
          console.error('[UpdateChecker] Install failed:', err);
          setError(err.message || 'Failed to install update');
          setInstalling(false);
        });
      }, 1000);
    };

    const handleUpdateError = (_event: any, errorMessage: string) => {
      console.error('[UpdateChecker] Error:', errorMessage);
      setError(errorMessage);
      setChecking(false);
      setDownloading(false);
    };

    // Register IPC listeners
    window.ipcApi.onUpdateAvailable(handleUpdateAvailable);
    window.ipcApi.onUpdateNotAvailable(handleUpdateNotAvailable);
    window.ipcApi.onDownloadProgress(handleDownloadProgress);
    window.ipcApi.onUpdateDownloaded(handleUpdateDownloaded);
    window.ipcApi.onUpdateError(handleUpdateError);

    // Trigger update check
    console.log('[UpdateChecker] Sending check-for-updates request');
    window.ipcApi.sendIpcRequest('app:check-for-updates')
      .then((response: any) => {
        console.log('[UpdateChecker] Raw response:', response);

        // Unwrap the IPC response (it's wrapped in {success: true, data: {...}})
        const result = response?.data || response;
        console.log('[UpdateChecker] Check result:', result);

        // In dev mode, just log and continue
        if (result?.devMode) {
          console.log('[UpdateChecker] DEV MODE ENABLED');
          console.log('[UpdateChecker] Message:', result.message);
          console.log('[UpdateChecker] Current version:', result.currentVersion);
          console.log('[UpdateChecker] Continuing to app...');
          // Skip to app immediately
          onUpdateComplete();
          return;
        }

        // In production, events will be triggered automatically via IPC events
        // If no events are triggered, we still need to handle the response
        if (!result?.updateAvailable) {
          console.log('[UpdateChecker] No update available, continuing to app');
          setTimeout(() => onUpdateComplete(), 500);
        }
      })
      .catch((err: any) => {
        console.error('[UpdateChecker] Check failed:', err);
        setError(err.message || 'Failed to check for updates');
        setChecking(false);
      });

    return () => {
      window.ipcApi?.offUpdateAvailable?.(handleUpdateAvailable);
      window.ipcApi?.offUpdateNotAvailable?.(handleUpdateNotAvailable);
      window.ipcApi?.offDownloadProgress?.(handleDownloadProgress);
      window.ipcApi?.offUpdateDownloaded?.(handleUpdateDownloaded);
      window.ipcApi?.offUpdateError?.(handleUpdateError);
    };
  }, [onUpdateComplete]);

  const handleSkipUpdate = () => {
    // Allow user to skip update in case of errors
    onUpdateComplete();
  };

  return (
    <UpdateDialog open={true} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 4 }}>
        <Stack spacing={3} alignItems="center">
          {/* Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: checking || downloading || installing
                ? `linear-gradient(135deg, #667eea, #764ba2)`
                : error
                ? `linear-gradient(135deg, #ef4444, #dc2626)`
                : `linear-gradient(135deg, #10b981, #059669)`,
              boxShadow: checking || downloading || installing
                ? `0 20px 40px rgba(118,75,162,0.4)`
                : `0 20px 40px rgba(16,185,129,0.3)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: (checking || downloading || installing) ? `${pulseAnimation} 2s ease-in-out infinite` : 'none',
            }}
          >
            {checking || downloading || installing ? (
              <CircularProgress size={40} sx={{ color: '#ffffff' }} />
            ) : error ? (
              <ErrorOutlineIcon sx={{ color: '#ffffff', fontSize: 40 }} />
            ) : (
              <CheckCircleOutlineIcon sx={{ color: '#ffffff', fontSize: 40 }} />
            )}
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {checking
              ? 'Checking for Updates...'
              : downloading
              ? 'Downloading Update...'
              : installing
              ? 'Installing Update...'
              : error
              ? 'Update Error'
              : 'Update Ready'}
          </Typography>

          {/* Content */}
          {checking && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Please wait while we check for the latest version
            </Typography>
          )}

          {updateAvailable && !downloading && !installing && !error && (
            <Stack spacing={2} width="100%">
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                A new version ({updateInfo?.version}) is available and will be downloaded automatically.
              </Alert>
            </Stack>
          )}

          {downloading && (
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                Downloading version {updateInfo?.version}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={downloadProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha('#667eea', 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ display: 'block', mt: 1 }}>
                {Math.round(downloadProgress)}%
              </Typography>
            </Box>
          )}

          {installing && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              The app will restart automatically to complete the installation
            </Typography>
          )}

          {error && (
            <Stack spacing={2} width="100%">
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
              <Button
                variant="outlined"
                onClick={handleSkipUpdate}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Continue Without Updating
              </Button>
            </Stack>
          )}
        </Stack>
      </DialogContent>
    </UpdateDialog>
  );
};

export default UpdateChecker;

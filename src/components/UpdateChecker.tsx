import React, { useState, useEffect } from 'react';
import '../styles/auth.css';

interface UpdateCheckerProps {
  onUpdateComplete: () => void;
}

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

const UpdateChecker: React.FC<UpdateCheckerProps> = ({ onUpdateComplete }) => {
  const [status, setStatus] = useState<'checking' | 'available' | 'downloading' | 'installing' | 'error'>('checking');
  const [message, setMessage] = useState('Checking for updates...');
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  useEffect(() => {
    console.log('[UpdateChecker] Starting update check');

    if (!window.ipcApi) {
      console.log('[UpdateChecker] IPC API not available, skipping');
      setTimeout(() => onUpdateComplete(), 100);
      return;
    }

    console.log('[UpdateChecker] Registering event listeners');

    // Get current version
    window.ipcApi.sendIpcRequest('app:get-version')
      .then((response: any) => {
        const version = response?.data?.version || response?.version || 'Unknown';
        setCurrentVersion(version);
      })
      .catch(err => console.error('[UpdateChecker] Failed to get version:', err));

    // Listen for update events from main process
    const handleUpdateAvailable = (_event: any, info: UpdateInfo) => {
      console.log('[UpdateChecker] Update available:', info);
      setUpdateInfo(info);
      setStatus('downloading');
      setMessage(`Downloading version ${info.version}...`);
      // Auto-download is now enabled in main.ts, so download will start automatically
    };

    const handleUpdateNotAvailable = () => {
      console.log('[UpdateChecker] No updates available, continuing to app');
      setStatus('checking');
      setMessage('You have the latest version');
      setTimeout(() => {
        onUpdateComplete();
      }, 1000);
    };

    const handleDownloadProgress = (_event: any, progressInfo: any) => {
      console.log('[UpdateChecker] Download progress:', progressInfo.percent);
      setStatus('downloading');
      setMessage(`Downloading update...`);
      setDownloadProgress(Math.round(progressInfo.percent || 0));
    };

    const handleUpdateDownloaded = () => {
      console.log('[UpdateChecker] Update downloaded, preparing install');
      setStatus('installing');
      setMessage('Update ready to install');
      setDownloadProgress(100);

      // Auto-install the update after a brief moment
      setTimeout(() => {
        console.log('[UpdateChecker] Triggering install');
        window.ipcApi!.sendIpcRequest('app:install-update').catch((err: any) => {
          console.error('[UpdateChecker] Install failed:', err);
          setError(err.message || 'Failed to install update');
          setStatus('error');
        });
      }, 1500);
    };

    const handleUpdateError = (_event: any, errorMessage: string) => {
      console.error('[UpdateChecker] Error:', errorMessage);
      setError(errorMessage);
      setStatus('error');
      setMessage('Update failed');
    };

    // Register IPC listeners
    window.ipcApi.onUpdateAvailable?.(handleUpdateAvailable);
    window.ipcApi.onUpdateNotAvailable?.(handleUpdateNotAvailable);
    window.ipcApi.onDownloadProgress?.(handleDownloadProgress);
    window.ipcApi.onUpdateDownloaded?.(handleUpdateDownloaded);
    window.ipcApi.onUpdateError?.(handleUpdateError);

    // Trigger update check
    console.log('[UpdateChecker] Sending check-for-updates request');
    window.ipcApi.sendIpcRequest('app:check-for-updates')
      .then((response: any) => {
        console.log('[UpdateChecker] Raw response:', response);

        // Unwrap the IPC response
        const result = response?.data || response;
        console.log('[UpdateChecker] Check result:', result);

        // In dev mode, just log and continue
        if (result?.devMode) {
          console.log('[UpdateChecker] DEV MODE ENABLED');
          console.log('[UpdateChecker] Message:', result.message);
          console.log('[UpdateChecker] Current version:', result.currentVersion);
          console.log('[UpdateChecker] Continuing to app...');
          onUpdateComplete();
          return;
        }

        // If no events are triggered, handle the response
        if (!result?.updateAvailable) {
          console.log('[UpdateChecker] No update available, continuing to app');
          setTimeout(() => onUpdateComplete(), 1000);
        }
      })
      .catch((err: any) => {
        console.error('[UpdateChecker] Check failed:', err);
        setError(err.message || 'Failed to check for updates');
        setStatus('error');
        setMessage('Update check failed');
      });

    return () => {
      window.ipcApi?.offUpdateAvailable?.(handleUpdateAvailable);
      window.ipcApi?.offUpdateNotAvailable?.(handleUpdateNotAvailable);
      window.ipcApi?.offDownloadProgress?.(handleDownloadProgress);
      window.ipcApi?.offUpdateDownloaded?.(handleUpdateDownloaded);
      window.ipcApi?.offUpdateError?.(handleUpdateError);
    };
  }, [onUpdateComplete]);

  const handleStartUpdate = () => {
    console.log('[UpdateChecker] User confirmed update, triggering download');
    setStatus('downloading');
    setMessage('Preparing download...');
    window.ipcApi!.sendIpcRequest('app:download-update').catch((err: any) => {
      console.error('[UpdateChecker] Download failed:', err);
      setError(err.message || 'Failed to download update');
      setStatus('error');
      setMessage('Download failed');
    });
  };

  const handleSkipUpdate = () => {
    console.log('[UpdateChecker] User skipped update');
    onUpdateComplete();
  };

  const handleRetry = () => {
    setStatus('checking');
    setMessage('Checking for updates...');
    setError(null);
    setDownloadProgress(0);
    window.location.reload();
  };

  return (
    <div className="auth-container">
      <div className="auth-card device-verify">
        {/* Icon */}
        <div className={`device-icon ${status}`}>
          {status === 'error' ? (
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="#FF3B30" strokeWidth="2" opacity="0.3"/>
              <path d="M50 30L30 50M30 30L50 50" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          ) : status === 'installing' ? (
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="url(#updateGradient)" strokeWidth="2" opacity="0.3"/>
              <path d="M30 40l8 8 16-16" stroke="url(#updateGradient)" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round" className="check-mark" />
              <defs>
                <linearGradient id="updateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#007AFF" />
                  <stop offset="100%" stopColor="#5856D6" />
                </linearGradient>
              </defs>
            </svg>
          ) : (
            <div className="device-animation">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="device-shield">
                <path d="M40 15L40 50M40 50L28 38M40 50L52 38"
                      stroke="url(#updateGradient)" strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="40" cy="55" r="3" fill="url(#updateGradient)"/>
                <path d="M25 62h30" stroke="url(#updateGradient)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="updateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#007AFF" />
                    <stop offset="100%" stopColor="#5856D6" />
                  </linearGradient>
                </defs>
              </svg>
              {status === 'checking' && <div className="pulse-ring" />}
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="auth-title">
          {status === 'checking' && 'Checking for Updates'}
          {status === 'available' && 'Update Available'}
          {status === 'downloading' && 'Downloading Update'}
          {status === 'installing' && 'Installing Update'}
          {status === 'error' && 'Update Error'}
        </h2>

        {/* Subtitle/Message */}
        <p className="auth-subtitle">{message}</p>

        {/* Version Info - Show when update is available */}
        {status === 'available' && updateInfo && (
          <div style={{
            marginBottom: '24px',
            padding: '20px',
            background: 'rgba(0, 122, 255, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 122, 255, 0.15)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              gap: '16px',
              marginBottom: updateInfo.releaseNotes ? '16px' : '0',
            }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px', fontWeight: 500 }}>
                  CURRENT
                </p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
                  {currentVersion}
                </p>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
                <path d="M5 12h14M14 5l7 7-7 7" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: '12px', color: '#007AFF', marginBottom: '4px', fontWeight: 600 }}>
                  NEW VERSION
                </p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#007AFF', margin: 0 }}>
                  {updateInfo.version}
                </p>
              </div>
            </div>

            {/* Release Notes Toggle */}
            {updateInfo.releaseNotes && (
              <>
                <button
                  onClick={() => setShowReleaseNotes(!showReleaseNotes)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#007AFF',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    borderTop: showReleaseNotes ? 'none' : '1px solid rgba(0, 122, 255, 0.15)',
                    paddingTop: showReleaseNotes ? '0' : '12px',
                  }}
                >
                  {showReleaseNotes ? '▼ Hide' : '▶ Show'} What's New
                </button>
                {showReleaseNotes && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1d1d1f',
                    textAlign: 'left',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                  }}>
                    {updateInfo.releaseNotes}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Progress Bar - Show when downloading */}
        {status === 'downloading' && (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${downloadProgress}%` }} />
            </div>
            <div style={{
              marginTop: '12px',
              fontSize: '14px',
              color: '#86868b',
              fontWeight: 500,
              textAlign: 'center',
            }}>
              {downloadProgress}%
            </div>
          </div>
        )}

        {/* Installing message */}
        {status === 'installing' && (
          <div style={{
            padding: '16px',
            background: 'rgba(52, 199, 89, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(52, 199, 89, 0.15)',
            fontSize: '14px',
            color: '#1d1d1f',
            marginBottom: '16px',
          }}>
            The app will restart automatically to complete the installation
          </div>
        )}

        {/* Error Message */}
        {error && status === 'error' && (
          <div className="error-message device-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zm0 12.5c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm.75-3.5c0 .414-.336.75-.75.75s-.75-.336-.75-.75V5c0-.414.336-.75.75-.75s.75.336.75.75v5z"/>
            </svg>
            {error}
          </div>
        )}

        {/* No action buttons - updates are forced */}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={handleRetry} className="submit-button retry-button">
              Try Again
            </button>
            <button
              onClick={handleSkipUpdate}
              style={{
                padding: '12px',
                background: 'none',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                color: '#86868b',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
              }}
            >
              Continue Without Updating
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateChecker;

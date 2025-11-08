import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import '../styles/auth.css';

const TOTPVerify: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(true);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    sendTOTP();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendTOTP = async () => {
    setIsSending(true);
    setError('');

    try {
      const result = await authService.generateTOTP();
      setEmailSent(true);
      setIsSending(false);
      setResendTimer(60); // 60 second cooldown

      // Focus first input
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setIsSending(false);
      setError(err.message || 'Failed to send verification code');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);

      // Focus last filled input or next empty one
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Handle single character input
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-advance to next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.verifyTOTP(fullCode);

      // Success - navigate to main app
      navigate('/signed-in-landing/report');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      setIsLoading(false);

      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      sendTOTP();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card totp-verify">
        <div className="auth-logo">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <rect x="15" y="20" width="30" height="25" rx="3" stroke="url(#totpGradient)" strokeWidth="2" fill="none"/>
            <path d="M20 20V15a10 10 0 0120 0v5" stroke="url(#totpGradient)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="30" cy="33" r="3" fill="url(#totpGradient)"/>
            <defs>
              <linearGradient id="totpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#007AFF" />
                <stop offset="100%" stopColor="#5856D6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h2 className="auth-title">Verify Your Identity</h2>
        <p className="auth-subtitle">
          {isSending ? 'Sending verification code...' :
           emailSent ? 'Enter the 6-digit code sent to your email' :
           'Enter verification code'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="totp-input-container">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`totp-input ${error ? 'error' : ''}`}
                disabled={isLoading || isSending}
                autoComplete="off"
              />
            ))}
          </div>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zm0 12.5c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm.75-3.5c0 .414-.336.75-.75.75s-.75-.336-.75-.75V5c0-.414.336-.75.75-.75s.75.336.75.75v5z"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || isSending || code.join('').length !== 6}
          >
            {isLoading ? (
              <span className="loading-spinner" />
            ) : (
              'Verify Code'
            )}
          </button>
        </form>

        <div className="totp-footer">
          <button
            onClick={handleResend}
            className="resend-button"
            disabled={resendTimer > 0 || isSending}
          >
            {resendTimer > 0 ? (
              `Resend code in ${resendTimer}s`
            ) : (
              'Resend verification code'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TOTPVerify;
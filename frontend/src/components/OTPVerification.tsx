'use client';

import { FC, useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOTP, clearError } from '../store/authSlice';
import type { AppDispatch } from '../store';
import type { RootState } from '../store';
import type { OTPVerificationProps } from '../types';

const OTPVerification: FC<OTPVerificationProps> = ({ email, onSuccess, onBack }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { error: globalError } = useSelector((state: RootState) => state.auth);

  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    otpInputRef.current?.focus();
  }, []);

  const handleVerify = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setLocalError(null);
    dispatch(clearError());
    const result = await dispatch(verifyOTP({ email, otp: otp.trim() }));
    setLoading(false);
    if (verifyOTP.fulfilled.match(result)) {
      onSuccess();
    } else {
      setLocalError('Invalid OTP. Please try again or resend.');
    }
  }, [dispatch, email, otp, onSuccess]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (localError || globalError) {
      setLocalError(null);
      dispatch(clearError());
    }
  }, [localError, globalError, dispatch]);

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    setOtp('');
    setLocalError(null);
    dispatch(clearError());
  }, [onBack, dispatch]);

  const displayError = localError || globalError;

  return (
    <form onSubmit={handleVerify} className="space-y-4" role="form" aria-label="OTP verification form">
      <div>
        <p className="text-sm text-gray-600 mb-2" id="email-desc">OTP sent to: {email}</p>
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
          Enter 6-digit OTP
        </label>
        <input
          ref={otpInputRef}
          id="otp"
          name="otp"
          type="text"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
          maxLength={6}
          disabled={loading}
          aria-describedby={displayError ? 'otp-error' : 'email-desc'}
          aria-invalid={!!displayError}
          autoComplete="one-time-code"
        />
        {displayError && (
          <p id="otp-error" className="text-sm text-red-600 mt-1" role="alert">
            {displayError}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {otp.length}/6 digits entered
        </p>
      </div>
      <div className="space-y-2">
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          disabled={!otp || otp.length !== 6 || loading}
          aria-label="Verify OTP code"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </span>
          ) : (
            'Verify OTP'
          )}
        </button>
        {onBack && (
          <button
            type="button"
            onClick={handleBack}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
            aria-label="Go back to email input"
          >
            Back to Email
          </button>
        )}
      </div>
    </form>
  );
};

export default OTPVerification;

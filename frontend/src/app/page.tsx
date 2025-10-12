'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { sendOTP } from '../store/authSlice'; 
import type { RootState, AppDispatch } from '../store';
import Login from '../components/Login'; 
import OTPVerification from '../components/OTPVerification'; 

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !hasRedirected) {
      setHasRedirected(true);
      router.push('/dashboard');
    }
  }, [isAuthenticated, router, hasRedirected]);

  useEffect(() => {
    if (error) {
      alert(error); 
    }
  }, [error]);

  const handleSendOTP = useCallback(async () => {
    if (!email.trim()) {
      alert('Please enter a valid email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    const result = await dispatch(sendOTP(email));
    if (sendOTP.fulfilled.match(result)) {
      setStep(2); 
    } else {
      alert('Failed to send OTP. Please try again.');
    }
  }, [dispatch, email]);

  const handleOTPSuccess = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleBackToEmail = useCallback(() => {
    setStep(1);
    setEmail(''); 
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600 flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></div>
          Processing...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Login to Ticket Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive an OTP for secure login.
          </p>
        </div>
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10" role="main" aria-label="Login form">
          {step === 1 ? (
            <Login email={email} setEmail={setEmail} onSendOTP={handleSendOTP} />
          ) : (
            <OTPVerification 
              email={email} 
              onSuccess={handleOTPSuccess} 
              onBack={handleBackToEmail} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
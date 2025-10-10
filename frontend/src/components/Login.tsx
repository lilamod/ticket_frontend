'use client'; // Required for hooks in Next.js App Router

import { FC } from 'react';
import type { LoginProps } from '../types'; // Use shared types if available; otherwise, define inline

const Login: FC<LoginProps> = ({ email, setEmail, onSendOTP }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendOTP();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-label="Email login form">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email" 
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          required
          aria-required="true"
          disabled={false} 
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        disabled={!email.trim()}
        aria-label="Send OTP to email"
      >
        Send OTP
      </button>
    </form>
  );
};

export default Login;
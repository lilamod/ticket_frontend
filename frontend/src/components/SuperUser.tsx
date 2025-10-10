'use client';

import React, { FC, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSuperUser } from '../store/uiSlice';
import type { RootState, AppDispatch } from '../store';

const SuperUserToggle: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSuperUser } = useSelector((state: RootState) => state.ui);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = useCallback(() => {
    if (isSuperUser) {
      dispatch(toggleSuperUser(false));
    } else {
      setShowPasswordModal(true);
      setError(null);
    }
  }, [dispatch, isSuperUser]);

  const verifyPassword = async (pwd: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(pwd === 'admin123');
      }, 500);
    });
  };

  const handleConfirmPassword = async () => {
    if (!password) {
      setError('Please enter a password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const isValid = await verifyPassword(password);
      if (!isValid) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }

      dispatch(toggleSuperUser(true));
      setShowPasswordModal(false);
      setPassword('');
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('Password verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowPasswordModal(false);
    setPassword('');
    setError(null);
  };

  useEffect(() => {
    return () => setPassword('');
  }, []);

  const PasswordModal = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-labelledby="password-modal-title"
      aria-modal="true"
      onClick={handleCancel}
    >
      <div
        className="bg-white p-6 rounded-md max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="password-modal-title" className="text-lg font-bold mb-4">
          Enter Password
        </h3>
        <input
          type="password"
          id="password-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? 'password-error' : undefined}
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && (
          <p id="password-error" className="text-red-500 text-sm mb-4" role="alert">
            {error}
          </p>
        )}

        <div className="flex space-x-2">
          <button
            onClick={handleConfirmPassword}
            disabled={loading || !password}
            className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={loading}
          >
            {loading ? 'Enabling...' : 'Confirm'}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-4 p-3 bg-gray-100 rounded-md">
      <label className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">SuperUser Mode</span>
        <button
          onClick={handleToggle}
          aria-label="Toggle Super User Mode"
          aria-checked={isSuperUser}
          role="switch"
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
              isSuperUser ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </label>

      {showPasswordModal &&
        createPortal(<PasswordModal />, document.body)}

      {isSuperUser && (
        <p className="text-xs text-green-600">Enabled: Shows user info on tickets</p>
      )}
    </div>
  );
};

export default SuperUserToggle;

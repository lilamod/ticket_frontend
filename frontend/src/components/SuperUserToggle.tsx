'use client'; 

import React, { FC, useState, useCallback, useEffect, memo } from 'react';
import { createPortal } from 'react-dom'; 
import { useDispatch, useSelector } from 'react-redux';
import { toggleSuperUser   } from '../store/uiSlice';
import type { RootState, AppDispatch } from '../store'; 
import api from '../lib/api';  
const PasswordModal: FC<{
  password: string;
  error: string | null;
  loading: boolean;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}> = memo(({ password, error, loading, onChange, onConfirm, onCancel }) => {
  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-labelledby="password-modal-title"
      aria-modal="true"
      onClick={onCancel} // Close on overlay click
    >
      <div
        className="bg-white p-6 rounded-md max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing on modal click
      >
        <h3 id="password-modal-title" className="text-lg font-bold mb-4">
          Enter Super User Password
        </h3>
        <input
          type="password"
          id="password-input"
          placeholder="Password"
          value={password}
          onChange={(e) => onChange(e.target.value)} 
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
            onClick={onConfirm}
            disabled={loading || !password}
            className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={loading}
          >
            {loading ? 'Enabling...' : 'Confirm'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

PasswordModal.displayName = 'PasswordModal'; 

const SuperUserToggle: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSuperUser   } = useSelector((state: RootState) => state.ui);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token');
  const handleToggle = useCallback(() => {
    if (isSuperUser  ) {
      handleDisableSuperUser ();
    } else {
      setShowPasswordModal(true);
      setError(null);
    }
  }, [isSuperUser ]);

 
  const enableSuperUser  = async (pwd: string): Promise<boolean> => {
    try {
      const response = await api.post('auth/enable', { password: pwd },  {
        headers: {
          token: token, 
        },}
      );
      return response.data.success;  
    } catch (err: any) {
    console.log(err);
    return err;
    }
  };

  const disableSuperUser  = async (): Promise<void> => {
    try {
      await api.post('/api/superuser/disable');
    } catch (err: any) {
      console.error('Disable super user error:', err);
    }
  };

  const handleDisableSuperUser  = async () => {
    setLoading(true);
    await disableSuperUser ();
    dispatch(toggleSuperUser (false));
    setLoading(false);
  };

  const handleConfirmPassword = async () => {
    if (!password) {
      setError('Please enter a password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const isValid = await enableSuperUser (password);
      if (!isValid) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }

      dispatch(toggleSuperUser (true)); 
      setShowPasswordModal(false);
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
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

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const handleModalConfirm = useCallback(() => {
    handleConfirmPassword();
  }, [password]); 

  const handleModalCancel = useCallback(() => {
    handleCancel();
  }, []);

  useEffect(() => {
    return () => setPassword('');
  }, []);

  return (
    <div className="mb-4 p-3 bg-gray-100 rounded-md">
      <label className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Super User Mode</span>
        <button
          onClick={handleToggle}
          aria-label="Toggle Super User Mode"
          aria-checked={isSuperUser }
          role="switch"
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
              isSuperUser  ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </label>

      {showPasswordModal && (
        <PasswordModal
          password={password}
          error={error}
          loading={loading}
          onChange={handlePasswordChange}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}

      {isSuperUser  && (
        <p className="text-xs text-green-600">Enabled: Shows user info on tickets</p>
      )}
    </div>
  );
};

export default SuperUserToggle;
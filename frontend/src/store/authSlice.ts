import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { AuthState, User, ApiResponse } from '../types';
import api from '../lib/api';

interface ApiErrorResponse {
  message: string;
}

// 1. Send OTP
export const sendOTP = createAsyncThunk<
  { message: string },
  string,
  { rejectValue: string }
>('auth/sendOTP', async (email, { rejectWithValue }) => {
  try {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/send-otp', { email });
    return response.data.data;
  } catch (error: unknown) {
    console.error('Send OTP error:', error);
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message || (error as Error).message || 'Failed to send OTP';
    return rejectWithValue(message);
  }
});

// 2. Verify OTP
export const verifyOTP = createAsyncThunk<
  { token: string; user: User },
  { email: string; otp: string },
  { rejectValue: string }
>('auth/verifyOTP', async ({ email, otp }, { rejectWithValue }) => {
  try {
    const verifyResponse = await api.post<ApiResponse<{ token: string }>>('/auth/verify-otp', { email, otp });
    const token = verifyResponse.data.data.token;
    localStorage.setItem('token', token);

    const userResponse = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    const user = userResponse.data.data.user;

    return { token, user };
  } catch (error: unknown) {
    console.error('Verify OTP error:', error);
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message || (error as Error).message || 'Invalid OTP';
    return rejectWithValue(message);
  }
});

// 3. Load Auth
export const loadAuth = createAsyncThunk<
  { token: string; user: User } | null,
  void,
  { rejectValue: string }
>('auth/loadAuth', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    const user = response.data.data.user;

    return { token, user };
  } catch (error: unknown) {
    console.error('Auth loading failed:', error);
    localStorage.removeItem('token');

    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message || (error as Error).message || 'Failed to load auth';
    return rejectWithValue(message);
  }
});

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    setToken: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to send OTP';
      })

      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Verification failed';
      })

      // Load Auth
      .addCase(loadAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      })
      .addCase(loadAuth.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { clearError, logout, setToken } = authSlice.actions;
export default authSlice.reducer;

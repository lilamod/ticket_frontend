import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UiState } from '../types';

const initialState: UiState = {
  isSuperUser: false,
  lastSeen: Date.now(),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSuperUser: (state, action: PayloadAction<boolean>) => {
      state.isSuperUser = action.payload;
      state.lastSeen = Date.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`Super User Mode: ${action.payload ? 'ON' : 'OFF'}`);
      }
    },
    setSuperUserFromAuth: (state, action: PayloadAction<boolean>) => {
      state.isSuperUser = action.payload;
      state.lastSeen = Date.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`Super User Mode set from auth: ${action.payload ? 'ON' : 'OFF'}`);
      }
    },
    updateLastSeen: (state, action: PayloadAction<number>) => {
      state.lastSeen = action.payload;
    },
  },
});

export const { toggleSuperUser, setSuperUserFromAuth, updateLastSeen } = uiSlice.actions;
export default uiSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import type { AuthState, ProjectsState, TicketsState, NotificationsState, UiState } from '../types'; // Import state shapes
import authSlice from './authSlice';
import projectsSlice from './projectsSlice';
import ticketsSlice from './ticketsSlice';
import notificationsSlice from './notificationsSlice';
import uiSlice from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    projects: projectsSlice,
    tickets: ticketsSlice,
    notifications: notificationsSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
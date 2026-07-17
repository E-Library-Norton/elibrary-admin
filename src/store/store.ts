// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import authReducer from './authSlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth:              authReducer,
    notifications:     notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
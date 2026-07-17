// src/store/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  avatar:    string;
  username:  string;
  email:     string;
  studentId: string | null;
  firstName: string | null;
  lastName:  string | null;
  roles: string[];
  /** Flat list of all resolved permission names (from roles + direct assignments) */
  permissions: string[];
  twoFactorEnabled?: boolean;
  isEmailVerified?: boolean;
}

interface AuthState {
  user:        AuthUser | null;
  accessToken: string | null;   // ← lives in memory only (never localStorage)
}

const initialState: AuthState = {
  user:        null,
  accessToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) {
      state.user        = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    clearUser(state) {
      state.user        = null;
      state.accessToken = null;
    },
  },
});

export const { setCredentials, setAccessToken, clearUser } = authSlice.actions;
export default authSlice.reducer;

// Selector
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectUser        = (state: { auth: AuthState }) => state.auth.user;

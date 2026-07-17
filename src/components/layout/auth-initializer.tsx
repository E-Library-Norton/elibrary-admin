'use client';

// src/components/layout/auth-initializer.tsx
// On every page load:
//  1. Calls /api/auth/profile  → hydrates Redux with user object
//  2. Calls /api/auth/token    → hydrates Redux with decrypted accessToken
//     so downstream RTK services can attach Bearer headers to Express calls
//
// Both endpoints read the encrypted HTTP-only cookie server-side.
// The browser never sees the raw cookie value.

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, setAccessToken, clearUser } from '@/store/authSlice';
import type { AuthUser } from '@/store/authSlice';
import { useGetProfileQuery } from '@/services/authApi';

export default function AuthInitializer() {
  const dispatch    = useDispatch();
  const initialized = useRef(false);

  const { data, isSuccess, isError, status } = useGetProfileQuery();

  useEffect(() => {
    if (status === 'pending' || status === 'uninitialized') return;

    if (isSuccess && data?.success && data.data) {
      const raw  = data.data as unknown;
      const user = (raw as { user?: AuthUser })?.user ?? (raw as AuthUser);
      dispatch(setCredentials({ user, accessToken: '' }));
      initialized.current = true;

      // Also fetch the decrypted access token so RTK direct-backend calls work
      fetch('/api/auth/token', { credentials: 'include' })
        .then((r) => r.json())
        .then((json) => {
          if (json?.success && json.data?.accessToken) {
            dispatch(setAccessToken(json.data.accessToken));
          }
        })
        .catch(() => {/* silently ignore */});
    } else if (isError && !initialized.current) {
      dispatch(clearUser());
    }
  }, [isSuccess, isError, status, data, dispatch]);

  return null;
}

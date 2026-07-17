// src/hooks/useAuth.ts
'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, setAccessToken, clearUser, selectUser, selectAccessToken, type AuthUser } from '@/store/authSlice';
import { useLoginMutation, useLogoutMutation, useTwoFAVerifyMutation } from '@/services/authApi';
import type { LoginPayload } from '@/services/authApi';

/** Roles that are allowed to log into the admin dashboard (lowercase) */
const ALLOWED_ROLES = ['admin', 'librarian'];

/** Case-insensitive check: does the user hold at least one allowed role? */
const hasAllowedRole = (roles: string[]) =>
  roles.some((r) => ALLOWED_ROLES.includes(r.toLowerCase()));

/** Clear auth cookies by calling the server-side logout route */
const clearAuthCookies = () =>
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});

export function useAuth() {
  const dispatch  = useDispatch();
  const router    = useRouter();
  const user      = useSelector(selectUser);
  const token     = useSelector(selectAccessToken);

  const [loginMutation,  { isLoading: isLoggingIn  }] = useLoginMutation();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [verify2FA] = useTwoFAVerifyMutation();

  // ── Silent refresh on page load / tab focus ───────────────────────────────
  // When Redux state is wiped (page refresh), try to get a new accessToken
  // using the httpOnly refreshToken cookie that persists in the browser.
  const silentRefresh = useCallback(async () => {
    if (token) return; // already have a token in memory — skip

    try {
      const res = await fetch('/api/auth/refresh', {
        method:      'POST',
        credentials: 'include', // sends the httpOnly refreshToken cookie
      });

      if (!res.ok) return; // not logged in — stay on login page

      const data     = await res.json();
      const newToken = data?.data?.accessToken;
      if (!newToken) return;

      // The refresh endpoint only returns a token, not user data.
      // Fetch the profile so we can check the role before granting access.
      const profileRes = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${newToken}` },
      });

      if (!profileRes.ok) return;

      const profileData    = await profileRes.json();
      const raw            = profileData?.data as unknown;
      const restoredUser   = (raw as { user?: AuthUser })?.user ?? (raw as AuthUser);
      const restoredRoles: string[] = restoredUser?.roles ?? [];

      // ── Role gate: only admin / librarian may restore a session ──
      if (!hasAllowedRole(restoredRoles)) {
        dispatch(clearUser());
        await clearAuthCookies(); // remove cookies so refresh can't loop back
        return; // not allowed — stay on login
      }

      dispatch(setCredentials({ user: restoredUser, accessToken: newToken }));

      // If we're on the login page, redirect to dashboard now that role is verified
      if (window.location.pathname === '/login') {
        router.replace('/dashboard');
      }
    } catch {
      // silently fail — user will be redirected to login by protected routes
    }
  }, [token, dispatch, router]);

  useEffect(() => {
    silentRefresh();
  }, [silentRefresh]);

  // Login — checks that the user has an allowed dashboard role
  const login = async (credentials: LoginPayload) => {
    const result = await loginMutation(credentials).unwrap();

    // ── 2FA required? Return early so UI can show the OTP screen ──
    const loginData = result.data as any;
    if (loginData?.requires2FA) {
      return {
        requires2FA: true as const,
        tempToken: loginData.tempToken as string,
        hasFaceEnrolled: loginData.hasFaceEnrolled as boolean,
      };
    }

    // Extract the user from whatever shape the API returns
    const raw      = result.data as unknown;
    const authUser = (raw as { user?: AuthUser })?.user ?? (raw as AuthUser);
    const roles    = authUser?.roles ?? [];

    // Block non-admin / non-librarian accounts
    if (!hasAllowedRole(roles)) {
      dispatch(clearUser());
      await clearAuthCookies(); // wipe cookies so refresh can't sneak them in
      throw {
        data: {
          message:
            'Access denied. Only administrators and librarians can access this dashboard.',
        },
      };
    }

    // Role check passed — store credentials in Redux
    const accessToken = result.data?.accessToken ?? '';
    dispatch(setCredentials({ user: authUser, accessToken }));

    router.replace('/dashboard');
    return result;
  };

  // Complete 2FA — verifies OTP and finishes login
  const complete2FA = async (tempToken: string, otpCode?: string, recoveryCode?: string) => {
    const payload: any = { tempToken };
    if (recoveryCode) payload.recoveryCode = recoveryCode;
    else payload.token = otpCode;
    const result = await verify2FA(payload).unwrap();
    const loginData = result.data as any;
    const authUser = loginData?.user as AuthUser;
    const roles = authUser?.roles ?? [];

    if (!hasAllowedRole(roles)) {
      dispatch(clearUser());
      await clearAuthCookies();
      throw { data: { message: 'Access denied. Only administrators and librarians can access this dashboard.' } };
    }

    dispatch(setCredentials({ user: authUser, accessToken: loginData.accessToken }));
    router.replace('/dashboard');
    return result;
  };

  // Logout 
  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } finally {
      dispatch(clearUser());
      router.replace('/login');
    }
  };

  return {
    user,
    token,
    isAuthenticated: !!token,
    login,
    complete2FA,
    logout,
    isLoggingIn,
    isLoggingOut,
    silentRefresh,
  };
}
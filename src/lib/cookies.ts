// src/lib/cookies.ts
// Server-side only — used in Route Handlers and Server Components.
// All tokens are AES-256-GCM encrypted before being stored in cookies.

import { cookies } from 'next/headers';
import { encryptToken, decryptToken } from './crypto';

const IS_PROD = process.env.NODE_ENV === 'production';

export const COOKIE_NAMES = {
  ACCESS_TOKEN:  'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

const BASE_OPTIONS = {
  httpOnly:  true,            // Never readable by JS / document.cookie
  secure:    IS_PROD,         // HTTPS-only in production
  sameSite:  'lax' as const,  // Blocks CSRF POSTs, allows GET navigation
  path:      '/',
};

// ── Write encrypted access token (30 days) ───────────────────────────────────
export async function setAccessTokenCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, encryptToken(token), {
    ...BASE_OPTIONS,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

// ── Write encrypted refresh token (60 days) ──────────────────────────────────
export async function setRefreshTokenCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, encryptToken(token), {
    ...BASE_OPTIONS,
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
}

// ── Read & decrypt access token ───────────────────────────────────────────────
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  if (!raw) return null;
  return decryptToken(raw);
}

// ── Read & decrypt refresh token ──────────────────────────────────────────────
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
  if (!raw) return null;
  return decryptToken(raw);
}

// ── Clear both tokens on logout ───────────────────────────────────────────────
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN);
  cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN);
}
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { getAccessToken, clearAuthCookies } from '@/lib/cookies';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST() {
  try {
    const accessToken = await getAccessToken();

    // Notify backend (optional — to invalidate server-side session if needed)
    if (accessToken) {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {}); // fire and forget — don't block logout
    }

    // ── Always clear cookies regardless of backend response ──────────────────
    await clearAuthCookies();

    return NextResponse.json({ success: true, message: 'Logged out successfully' });

  } catch (err) {
    console.error('[/api/auth/logout]', err);
    // Still clear cookies even if something went wrong
    await clearAuthCookies();
    return NextResponse.json({ success: true, message: 'Logged out' });
  }
}
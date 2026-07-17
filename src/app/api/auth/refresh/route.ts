// src/app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import {
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies
} from '@/lib/cookies';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'No refresh token' },
        { status: 401 }
      );
    }

    // Forward to Express
    const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      await clearAuthCookies();
      return NextResponse.json(
        { success: false, message: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    const newAccessToken = data?.data?.accessToken ?? data?.accessToken;
    const newRefreshToken = data?.data?.refreshToken ?? data?.refreshToken;

    if (!newAccessToken) {
      await clearAuthCookies();
      return NextResponse.json(
        { success: false, message: 'Token refresh failed' },
        { status: 401 }
      );
    }

    // Set new access token cookie so server-side routes (profile, etc.) can use it
    await setAccessTokenCookie(newAccessToken);

    // Rotate refreshToken cookie if Express returned a new one
    if (newRefreshToken) {
      await setRefreshTokenCookie(newRefreshToken);
    }

    // ── Return new accessToken in JSON body so Redux can update its state ─────
    return NextResponse.json({
      success: true,
      message: 'Token refreshed',
      data: { accessToken: newAccessToken }
    });
  } catch (err) {
    console.error('[/api/auth/refresh]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

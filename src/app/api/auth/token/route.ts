// src/app/api/auth/token/route.ts
// Returns the decrypted access token to the client (Redux in-memory).
// Used by AuthInitializer on every page load to rehydrate the accessToken
// after a page refresh (Redux state is cleared on refresh but the cookie persists).
//
// This is safe: the response is read by the browser's JavaScript, but the token
// only lives in Redux memory — never localStorage. The refresh token remains
// cookie-only and is NEVER returned here.
import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/cookies';

export async function GET() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: 'No session' },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, data: { accessToken } });
}

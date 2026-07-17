// src/app/api/auth/login/route.ts
//
// Security model:
//   - refreshToken  → encrypted HTTP-only cookie ONLY (never in response body)
//   - accessToken   → encrypted HTTP-only cookie + returned in response body
//     ↳ Cookie: used by Next.js proxy routes to call the backend on behalf of server
//     ↳ Body:   used by Redux (in-memory only) so client-side RTK services can attach
//               Bearer tokens when calling the Express backend directly
//
// The accessToken in the body is NOT stored in localStorage — only in Redux memory.
// It is cleared on page refresh and re-fetched via /api/auth/token (AuthInitializer).
import { NextRequest, NextResponse } from 'next/server';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/lib/cookies';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // ── 2FA required? Pass the response straight through (no tokens yet) ──
    if (data?.data?.requires2FA) {
      return NextResponse.json(data);
    }

    const accessToken  = data?.data?.accessToken  ?? data?.accessToken;
    const refreshToken = data?.data?.refreshToken ?? data?.refreshToken;
    const user         = data?.data?.user         ?? data?.user;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication failed — tokens not returned by server' },
        { status: 500 }
      );
    }

    // Encrypt both tokens into HTTP-only cookies (server-side use)
    await setAccessTokenCookie(accessToken);
    await setRefreshTokenCookie(refreshToken);

    // Return user + plain accessToken to client for Redux in-memory storage.
    // The refreshToken stays cookie-only and is NEVER in the response body.
    return NextResponse.json({
      success: true,
      message: data.message || 'Login successful',
      data: { user, accessToken },
    });

  } catch (err) {
    console.error('[/api/auth/login] error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// src/app/api/auth/2fa/[...path]/route.ts
// Proxies all 2FA requests to the backend with the access token from cookies.
// When /2fa/verify returns tokens (login completion), it also sets httpOnly cookies.
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, setAccessTokenCookie, setRefreshTokenCookie } from '@/lib/cookies';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const subPath = path.join('/');
    const accessToken = await getAccessToken();

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const body = ['POST', 'PUT', 'PATCH'].includes(req.method)
      ? JSON.stringify(await req.json().catch(() => ({})))
      : undefined;

    const backendRes = await fetch(`${BACKEND_URL}/auth/2fa/${subPath}`, {
      method: req.method,
      headers,
      body,
    });

    const data = await backendRes.json();

    // When /2fa/verify completes login, set httpOnly cookies for the real tokens
    if (subPath === 'verify' && backendRes.ok && data?.data?.accessToken && data?.data?.refreshToken) {
      await setAccessTokenCookie(data.data.accessToken);
      await setRefreshTokenCookie(data.data.refreshToken);

      // Strip refreshToken from body — it stays cookie-only
      const { refreshToken, ...rest } = data.data;
      return NextResponse.json({
        ...data,
        data: rest,
      });
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[/api/auth/2fa proxy]', err);
    return NextResponse.json(
      { success: false, message: 'Two-factor proxy error' },
      { status: 500 }
    );
  }
}

export const GET  = proxy;
export const POST = proxy;
export const PUT  = proxy;

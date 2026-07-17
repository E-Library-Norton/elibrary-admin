// src/app/api/auth/profile/route.ts
// Reads the encrypted HTTP-only access_token cookie and proxies to the backend.
// Returns the user profile to the client — the token is never exposed.
import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/cookies';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const backendRes = await fetch(`${BACKEND_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[/api/auth/profile]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const backendRes = await fetch(`${BACKEND_URL}/auth/profile`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[/api/auth/profile PATCH]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

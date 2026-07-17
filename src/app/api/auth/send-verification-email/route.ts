// src/app/api/auth/send-verification-email/route.ts
import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/cookies';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST() {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/auth/send-verification-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[/api/auth/send-verification-email]', err);
    return NextResponse.json({ success: false, message: 'Failed to send verification email' }, { status: 500 });
  }
}

// src/app/api/auth/avatar/route.ts
// Proxy: receives multipart file from client → attaches Bearer token from
// encrypted cookie → forwards to Express POST /api/auth/avatar → returns result.
// This keeps the access token safely in the server and never exposes it to the browser.

import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/cookies';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ─── GET /api/auth/avatar ─────────────────────────────────────────────────────
// Authenticated same-origin proxy: streams the current user's avatar image.
export async function GET() {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return new NextResponse(null, { status: 401 });
    }

    const upstream = await fetch(`${BACKEND_URL}/auth/avatar`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    if (!upstream.ok || !upstream.body) {
      return new NextResponse(null, { status: upstream.status });
    }

    const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg';

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

// ─── POST /api/auth/avatar ────────────────────────────────────────────────────
// Upload multipart file → backend → returns JSON.
export async function POST(req: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    // Read the multipart body and forward it as-is to the Express backend
    const formData = await req.formData();

    const backendRes = await fetch(`${BACKEND_URL}/auth/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // DO NOT set Content-Type — let the browser set it with the correct boundary
      },
      body: formData,
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });

  } catch (err) {
    console.error('[/api/auth/avatar]', err);
    return NextResponse.json({ success: false, message: 'Avatar upload failed' }, { status: 500 });
  }
}

// Remove avatar — sets avatar to empty string in DB
export async function DELETE() {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    // Update profile with empty avatar
    const backendRes = await fetch(`${BACKEND_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatar: '' }),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });

  } catch (err) {
    console.error('[/api/auth/avatar DELETE]', err);
    return NextResponse.json({ success: false, message: 'Failed to remove avatar' }, { status: 500 });
  }
}

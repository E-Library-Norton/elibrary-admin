// src/app/api/auth/reset-password/route.ts
import { type NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const upstream = await fetch(`${BACKEND_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(115_000),
    });
    const text = await upstream.text();
    let data: unknown;
    try { data = JSON.parse(text); }
    catch { data = { success: false, message: 'Backend is starting up, please try again in a moment.' }; }
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    return NextResponse.json(
      { success: false, message: isTimeout
          ? 'The server is waking up. Please wait 30 seconds and try again.'
          : 'Could not reach the server. Please try again.' },
      { status: 503 }
    );
  }
}

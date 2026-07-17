// src/app/api/books/[id]/stream/route.ts
// Proxy: cookie auth (primary) or ?token= (fallback) → backend /stream → inline PDF
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/cookies';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const token =
    (await getAccessToken()) ??
    request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  const backendRes = await fetch(`${BACKEND_URL}/books/${id}/stream`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);

  if (!backendRes) {
    return NextResponse.json({ success: false, message: 'Backend unavailable' }, { status: 502 });
  }
  if (!backendRes.ok) {
    const body = await backendRes.json().catch(() => ({}));
    return NextResponse.json(body, { status: backendRes.status });
  }

  const resHeaders: Record<string, string> = {
    'Content-Type': backendRes.headers.get('Content-Type') ?? 'application/pdf',
  };
  const len = backendRes.headers.get('Content-Length');
  const dis = backendRes.headers.get('Content-Disposition');
  if (len) resHeaders['Content-Length'] = len;
  if (dis) resHeaders['Content-Disposition'] = dis;

  return new NextResponse(backendRes.body, { status: 200, headers: resHeaders });
}

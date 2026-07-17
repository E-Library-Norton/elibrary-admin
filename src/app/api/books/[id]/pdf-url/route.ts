// src/app/api/books/[id]/pdf-url/route.ts
// Proxy: cookie auth → backend /books/:id/pdf-url → returns presigned R2 URL
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/cookies';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token  = await getAccessToken();

  if (!token) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/books/${id}/pdf-url`, {
    headers: { Authorization: `Bearer ${token}` },
    cache:   'no-store',
  }).catch(() => null);

  if (!res) {
    return NextResponse.json({ success: false, message: 'Backend unavailable' }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

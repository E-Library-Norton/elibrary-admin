import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ─── GET /api/users/[id]/avatar ───────────────────────────────────────────────
// Public proxy: backend generates a presigned R2 signed URL and redirects.
// fetch() follows the 302 automatically, so we get the image bytes
// and stream them back to the browser same-origin (no CORS issues).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const upstream = await fetch(`${BACKEND_URL}/users/${id}/avatar`, {
      cache: 'no-store',
    }).catch(() => null);

    if (!upstream || !upstream.ok || !upstream.body) {
      return new NextResponse(null, { status: upstream?.status ?? 502 });
    }

    const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg';

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type':  contentType,
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

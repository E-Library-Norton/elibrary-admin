import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/dashboard'];
const PUBLIC    = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken  = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const hasSession   = !!(accessToken || refreshToken);

  // 1. Unauthenticated -> Login
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Do NOT auto-redirect /login → /dashboard here.
  //    The client-side useAuth.silentRefresh checks the user's role first.
  //    Only after the role check passes does it redirect to /dashboard.

  return NextResponse.next();
}

export const config = {
  // Matcher is correct
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
  // REMOVED runtime: 'edge' manually here because Next.js Middleware 
  // is Edge by default, and Sentry's wrapper prefers to handle this itself.
};
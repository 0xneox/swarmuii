import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // NOTE: Auth is now handled client-side via AuthContext + JWT tokens
  // Middleware only handles basic redirects and security headers
  
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // All routes are now accessible - auth checks happen client-side
  // This allows proper navigation without server-side auth blocking
  
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (API endpoints)
     * - auth/callback (let it process OAuth first)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { createClient } from '@/utils/supabase/middleware';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  try {
    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Middleware session error:', error);
      // Continue with response even if session check fails
      return response;
    }

    const url = request.nextUrl.clone();
    const pathname = url.pathname;

    // Protected routes that require authentication
    const protectedRoutes = [
      '/earning', 
      '/referral', 
      '/settings'
    ];
    
    // Routes that should be accessible without authentication
    const publicRoutes = [
      '/',
      '/global-statistics',
      '/help-center',
      '/auth/callback',
      '/auth/error'
    ];

    // Check if the current path is protected
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );

    // Check if the current path is public
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );

    // If trying to access protected route without authentication
    if (isProtectedRoute && !session) {
      console.log(`🚫 Unauthorized access attempt to ${pathname}`);
      // Redirect to home page
      return NextResponse.redirect(new URL('/', request.url));
    }

    // If authenticated user tries to access auth pages, redirect to home
    if (session && (pathname === '/auth/callback' || pathname === '/auth/error')) {
      console.log(`🔄 Authenticated user redirected from ${pathname}`);
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Add session info to headers for debugging (optional)
    if (session) {
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-email', session.user.email || '');
    }

    return response;
  } catch (error) {
    console.error('❌ Middleware error:', error);
    // Return response even if middleware fails
    return response;
  }
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
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

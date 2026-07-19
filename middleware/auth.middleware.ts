import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

// Define public paths that do not require authentication
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
];

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public paths, static assets, and dev files
  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    // If user is already logged in and tries to access /login, redirect to dashboard (root)
    if (pathname === '/login') {
      const accessToken = request.cookies.get('access_token')?.value;
      if (accessToken) {
        const payload = await verifyAccessToken(accessToken);
        if (payload) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
    return NextResponse.next();
  }

  // 2. Read Access Token
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    return handleUnauthorized(request);
  }

  // 3. Verify Access Token
  const payload = await verifyAccessToken(accessToken);

  if (!payload) {
    return handleUnauthorized(request);
  }

  // 4. Role-based Route Protection
  // Roles: ADMIN, OPERATOR, VIEWER
  // VIEWER has read-only access (GET requests only). Let's restrict other methods for VIEWER.
  if (payload.role === 'VIEWER') {
    const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
    const isApiRequest = pathname.startsWith('/api/');
    
    // Prevent VIEWERS from making modifying actions on protected APIs
    if (isApiRequest && isWriteMethod && !pathname.startsWith('/api/auth/')) {
      return NextResponse.json(
        { error: 'Forbidden. Viewer role does not have write permissions.' },
        { status: 403 }
      );
    }
  }

  // Allow passing user info as custom headers so endpoints can access them
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function handleUnauthorized(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If it's an API route, return 401 JSON
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Unauthorized. Token is missing or expired.' },
      { status: 401 }
    );
  }

  // If it's a page route, redirect to /login with redirect callback parameter
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(loginUrl);
}

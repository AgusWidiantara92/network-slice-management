import { NextRequest } from 'next/server';
import { authMiddleware } from '@/middleware/auth.middleware';

export async function middleware(request: NextRequest) {
  return authMiddleware(request);
}

// Configure routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/public (public API routes if any)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public image files)
     */
    '/((?!api/public|_next/static|_next/image|favicon.ico|images).*)',
  ],
};

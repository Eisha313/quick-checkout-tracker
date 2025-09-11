import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require API key authentication
const protectedApiPaths = ['/api/carts', '/api/analytics', '/api/stripe'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a protected API route
  const isProtectedApi = protectedApiPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedApi) {
    // For now, we'll use a simple API key check
    // In production, you'd want to use proper authentication
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.API_SECRET_KEY;

    // Skip auth check if no API_SECRET_KEY is configured (development mode)
    if (validApiKey && apiKey !== validApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
};

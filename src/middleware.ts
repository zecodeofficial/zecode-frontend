// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Handle old slug format redirects (men-s- -> mens-, women-s- -> womens-, etc.)
  // This handles URLs with apostrophe encoding that became -s-
  if (pathname.match(/\/(men|women|kids)\/(?:men|women|kids|boy|girl)-s-/)) {
    const newPathname = pathname
      .replace(/men-s-/g, 'mens-')
      .replace(/women-s-/g, 'womens-')
      .replace(/kids-s-/g, 'kids-')
      .replace(/boy-s-/g, 'boys-')
      .replace(/girl-s-/g, 'girls-')
      // Also handle t-shirt -> t-shirt (ensure consistent)
      .replace(/-t-shirt$/, '-t-shirt');
    
    if (newPathname !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = newPathname;
      return NextResponse.redirect(url, { status: 301 });
    }
  }
  
  const response = NextResponse.next();
  
  // Add security headers not covered by next.config.ts
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // Content Security Policy - Updated for VTO feature
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.googletagmanager.com https://cdn.jsdelivr.net https://docs.opencv.org https://storage.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https: http:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https: wss: blob: data:;
    media-src 'self' blob:;
    worker-src 'self' blob:;
    frame-src 'self' https://www.google.com https://maps.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Permissions Policy - Allow camera for VTO
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)');
  
  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};

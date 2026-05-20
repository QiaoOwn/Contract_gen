import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {openAiApiKeyCookieKey} from './constant';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!image|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
export async function middleware(request: NextRequest) {
  console.log('request url', request.nextUrl.pathname);
  const {pathname} = request.nextUrl;
  if (pathname.startsWith('/api')) {
    if (pathname.startsWith('/api/save-info')) {
      // skip
    }
  } else {
    // Check if the user is authenticated
    const isAuthenticated = request.cookies.get(openAiApiKeyCookieKey)?.value;
    // If the user is not authenticated, redirect them to the login page
    if (!isAuthenticated && request.nextUrl.pathname !== '/auth') {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next({request});
}

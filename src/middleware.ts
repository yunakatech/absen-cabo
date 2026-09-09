import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, favicon, manifest, public assets, and setup route
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/setup') ||
    pathname.startsWith('/api/auth/login') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 1. Unauthenticated users trying to access protected routes -> redirect to /login
  if (!session) {
    if (pathname !== '/login') {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2. Authenticated users trying to access /login -> redirect to their dashboard
  if (pathname === '/login') {
    const url = req.nextUrl.clone();
    if (session.role === 'ADMIN') {
      url.pathname = '/admin';
    } else if (session.role === 'SUPERVISOR') {
      url.pathname = '/supervisor';
    } else {
      url.pathname = '/';
    }
    return NextResponse.redirect(url);
  }

  // 3. Admin routes protection
  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    const url = req.nextUrl.clone();
    url.pathname = session.role === 'SUPERVISOR' ? '/supervisor' : '/';
    return NextResponse.redirect(url);
  }

  // 4. Supervisor routes protection
  if (pathname.startsWith('/supervisor') && session.role !== 'SUPERVISOR' && session.role !== 'ADMIN') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

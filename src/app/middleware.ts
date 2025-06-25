import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/auth/login')) {
    return NextResponse.next();
  }
  
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    const telegramWebAppData = request.headers.get('sec-fetch-site');
    const userAgent = request.headers.get('user-agent');
    
    const isTelegramWebApp = userAgent && userAgent.includes('TelegramBot');
    
    if (!isTelegramWebApp && !request.cookies.has('telegram-auth')) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

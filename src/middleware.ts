import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApi = pathname.startsWith('/api/')
  const isLogin = pathname.startsWith('/auth/login')
  const isStatic = pathname.startsWith('/_next') || pathname === '/favicon.ico'
  const adminRoute = pathname.startsWith('/moderation')

  if (isLogin) return NextResponse.next()
  if (isApi) return NextResponse.next()
  if (isStatic) return NextResponse.next()

  if (adminRoute) {
    const convexUrlEnv = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrlEnv) return NextResponse.redirect(new URL('/', request.url))
    const baseUrl = convexUrlEnv.replace(/\/$/, '').replace(/\/api$/, '')

    const cookieVal = request.cookies.get('user-store')?.value
    const parseCookie = (val?: string): any => {
      if (!val) return null
      try { return JSON.parse(val) } catch {}
      try { return JSON.parse(decodeURIComponent(val)) } catch {}
      return null
    }
    const parsed = parseCookie(cookieVal)
    const telegramId = parsed?.state?.userData?.telegramId || parsed?.userData?.telegramId || parsed?.state?.telegramUser?.id || parsed?.telegramUser?.id
    if (typeof telegramId !== 'number') return NextResponse.redirect(new URL('/', request.url))

    try {
      const resp = await fetch(`${baseUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'users:checkUserRole', args: { telegramId } }),
      })
      if (!resp.ok) return NextResponse.redirect(new URL('/', request.url))
      const body = await resp.json()
      const v = typeof body === 'object' ? (body.value ?? body.result ?? body) : null
      if (!v || v.isAdmin !== true) return NextResponse.redirect(new URL('/', request.url))
    } catch {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// No Convex client import in middleware; use HTTP only

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApi = pathname.startsWith('/api/')
  const isLogin = pathname.startsWith('/auth/login')
  const isStatic = pathname.startsWith('/_next') || pathname === '/favicon.ico'
  const adminRoute = pathname.startsWith('/moderation')

  if (isLogin) return NextResponse.next()
  if (isApi) return NextResponse.next()
  if (isStatic) return NextResponse.next()

  const cookieVal = request.cookies.get('user-store')?.value
  const parseCookie = (val?: string): any => {
    if (!val) return null
    try { return JSON.parse(val) } catch {}
    try { return JSON.parse(decodeURIComponent(val)) } catch {}
    return null
  }
  const parsed = parseCookie(cookieVal)
  const isBlocked = parsed?.state?.userData?.isBlocked || parsed?.userData?.isBlocked
  if (isBlocked && pathname !== '/blocked') {
    const convexUrlEnv = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL
    let telegramId: any = parsed?.state?.userData?.telegramId || parsed?.userData?.telegramId || parsed?.state?.telegramUser?.id || parsed?.telegramUser?.id
    if (typeof telegramId === 'string') {
      const n = Number(telegramId)
      telegramId = Number.isNaN(n) ? telegramId : n
    }
    if (convexUrlEnv && typeof telegramId === 'number') {
      try {
        const baseUrl = convexUrlEnv.replace(/\/$/, '').replace(/\/api$/, '')
        const resp = await fetch(`${baseUrl}/api/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ path: 'users:getUserByTelegramId', args: { telegramId } }),
        })
        if (resp.ok) {
          const body = await resp.json()
          const v = typeof body === 'object' ? (body.value ?? body.result ?? body) : null
          if (v && v.isBlocked === true) {
            return NextResponse.redirect(new URL('/blocked', request.url))
          }
        }
      } catch {}
      return NextResponse.next()
    }
    return NextResponse.next()
  }

  if (adminRoute) {
    const convexUrlEnv = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL
    const baseUrl = convexUrlEnv ? convexUrlEnv.replace(/\/$/, '').replace(/\/api$/, '') : null

    const cookieRole = parsed?.state?.userData?.role || parsed?.userData?.role
    if (cookieRole === 'admin') {
      return NextResponse.next()
    }
    let telegramId: any = parsed?.state?.userData?.telegramId || parsed?.userData?.telegramId || parsed?.state?.telegramUser?.id || parsed?.telegramUser?.id
    if (typeof telegramId === 'string') {
      const n = Number(telegramId)
      telegramId = Number.isNaN(n) ? telegramId : n
    }
    if (!baseUrl || typeof telegramId !== 'number') {
      return NextResponse.next()
    }

    try {
      const resp = await fetch(`${baseUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ path: 'users:checkUserRole', args: { telegramId } }),
      })
      if (resp.ok) {
        const body = await resp.json()
        const v = typeof body === 'object' ? (body.value ?? body.result ?? body) : null
        if (!v || v.isAdmin !== true) return NextResponse.redirect(new URL('/', request.url))
      }
      // If resp not ok, allow request to proceed; backend functions still enforce admin
    } catch {
      // On error, allow request to proceed; backend functions still enforce admin
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


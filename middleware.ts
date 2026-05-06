import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const pathname = request.nextUrl.pathname
    const authed = request.cookies.get('demo_auth')?.value === 'true'

    if (pathname === '/') {
      return NextResponse.redirect(new URL(authed ? '/dashboard' : '/login', request.url))
    }
    if (pathname === '/login' && authed) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (pathname !== '/login' && !authed) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|escudo-banfield.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

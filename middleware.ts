import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/poulefase', '/oranje', '/knockout', '/fantasy', '/overzicht']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))

  if (isProtected && !request.cookies.get('participant')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/poulefase/:path*', '/oranje/:path*', '/knockout/:path*', '/fantasy/:path*', '/overzicht/:path*'],
}

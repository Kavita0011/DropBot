import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const rateLimit = new Map<string, { count: number; reset: number }>()

function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimit.get(key)

  if (!entry || now > entry.reset) {
    rateLimit.set(key, { count: 1, reset: now + windowMs })
    return false
  }

  if (entry.count >= maxRequests) return true

  entry.count++
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/auth/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const key = `${ip}:${pathname}`

    if (isRateLimited(key, 10, 60000)) {
      return new NextResponse("Too many requests", { status: 429 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/auth/:path*",
}

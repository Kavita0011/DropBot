import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// In-memory rate limiter — best-effort only, not shared across serverless instances.
// Map entry expires after the window passes; periodic cleanup every 60s prevents unbounded memory growth.
const rateLimit = new Map<string, { count: number; reset: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimit) {
    if (now > entry.reset) rateLimit.delete(key)
  }
}, 60000)

function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  let entry = rateLimit.get(key)

  if (!entry || now > entry.reset) {
    entry = { count: 1, reset: now + windowMs }
    rateLimit.set(key, entry)
    return false
  }

  if (entry.count >= maxRequests) return true

  entry.count++
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only rate-limit auth endpoints (login/register) — 10 requests per 60s per IP per path.
  // Uses x-forwarded-for header for IP extraction behind proxies (e.g., Vercel).
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

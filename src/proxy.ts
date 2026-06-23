import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// In-memory rate limiter — best-effort only, not shared across serverless instances.
// Map entry expires after the window passes; periodic cleanup every 60s prevents unbounded memory growth.
const rateLimit = new Map<string, { count: number; reset: number }>()

let cleanupInterval: ReturnType<typeof setInterval> | null = null
function ensureCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimit) {
      if (now > entry.reset) rateLimit.delete(key)
    }
    if (rateLimit.size === 0 && cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  }, 60000)
}

ensureCleanup()

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

  // Rate-limit auth endpoints — 10 requests per 60s per IP
  if (pathname.startsWith("/api/auth/")) {
    const key = `${ip}:${pathname}`
    if (isRateLimited(key, 10, 60000)) {
      return new NextResponse("Too many requests", { status: 429 })
    }
  }

  // Rate-limit public chat API — 30 requests per 60s per IP (prevents quota exhaustion attacks)
  if (pathname.startsWith("/api/chat/")) {
    const key = `${ip}:chat`
    if (isRateLimited(key, 30, 60000)) {
      return new NextResponse("Too many requests", { status: 429 })
    }
  }

  // CSRF origin check for all mutation endpoints (POST/PATCH/PUT/DELETE)
  if (["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    const host = request.headers.get("host") || ""
    const allowedHosts = [host, process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "")].filter(Boolean)
    if (origin || referer) {
      const source = (origin || referer || "").toLowerCase()
      const isSameOrigin = allowedHosts.some((h) => h && source.includes(h))
      if (!isSameOrigin) {
        return new NextResponse("Forbidden", { status: 403 })
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/chat/:path*", "/api/user/:path*", "/api/chatbots/:path*", "/api/admin/:path*", "/api/billing/:path*", "/api/upload/:path*"],
}

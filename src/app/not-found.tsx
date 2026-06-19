import type { Metadata } from "next"
import Link from "next/link"
import { MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you're looking for doesn't exist.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
        <MessageSquare className="h-8 w-8 text-blue-600" />
      </div>
      <h1 className="mb-2 text-4xl font-bold text-gray-900">404</h1>
      <p className="mb-6 text-gray-500">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Go home
      </Link>
    </div>
  )
}

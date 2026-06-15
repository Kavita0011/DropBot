import { MessageSquare } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">DropBot</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/#features" className="hover:text-gray-900">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-gray-900">
              Sign in
            </Link>
          </div>
          <p className="text-sm text-gray-400">&copy; 2026 DropBot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

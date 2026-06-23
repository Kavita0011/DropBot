import { MessageSquare } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-gray-200  bg-gray-50 ">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600 " />
              <span className="text-lg font-bold text-gray-900 ">DropBot</span>
            </div>
            <p className="text-sm text-gray-500 ">AI chatbot builder for your website.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900  mb-3">Product</h3>
            <div className="flex flex-col gap-2 text-sm text-gray-500 ">
              <Link href="/#features" className="hover:text-gray-900 ">Features</Link>
              <Link href="/pricing" className="hover:text-gray-900 ">Pricing</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900  mb-3">Legal</h3>
            <div className="flex flex-col gap-2 text-sm text-gray-500 ">
              <Link href="/terms" className="hover:text-gray-900 ">Terms &amp; Conditions</Link>
              <Link href="/privacy" className="hover:text-gray-900 ">Privacy Policy</Link>
              <Link href="/refund-policy" className="hover:text-gray-900 ">Refund Policy</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200  text-center text-sm text-gray-400 ">
          &copy; 2026 DropBot. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
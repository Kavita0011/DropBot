"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">DropBot</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Features
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Button asChild>
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-gray-200 bg-white transition-all duration-300 md:hidden",
          open ? "max-h-80" : "max-h-0"
        )}
      >
        <div className="space-y-2 px-4 py-4">
          <Link
            href="/#features"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Sign in
          </Link>
          <Button asChild className="w-full">
            <Link href="/register" onClick={() => setOpen(false)}>
              Get Started Free
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}

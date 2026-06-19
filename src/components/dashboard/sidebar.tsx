"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { MessageSquare, LayoutDashboard, Bot, CreditCard, Settings, LogOut, ChevronLeft, Shield } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { signOut } from "next-auth/react"

const userLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/chatbots", label: "Chatbots", icon: Bot },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as { role?: string })?.role === "admin"

  return (
    <aside className={cn("flex flex-col border-r bg-white transition-all duration-300 dark:bg-gray-900 dark:border-gray-700/60", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center justify-between border-b px-4 dark:border-gray-700/60">
        <Link href="/" className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
          <MessageSquare className="h-6 w-6 text-blue-600 flex-shrink-0" />
          {!collapsed && <span className="font-bold text-gray-900 dark:text-gray-100">DropBot</span>}
        </Link>
        <button onClick={onToggle} className={cn("rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800", collapsed && "hidden")}>
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <p className={cn("px-3 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500", collapsed && "text-center")}>{collapsed ? "..." : "Main"}</p>
        {userLinks.map((link) => {
          const Icon = link.icon
          const active = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href))
          return (
            <Link key={link.href} href={link.href}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                collapsed && "justify-center px-2")} title={collapsed ? link.label : undefined}>
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && link.label}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-gray-100 dark:border-gray-700/60" />
            <p className={cn("px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-500", collapsed && "text-center")}>{collapsed ? "..." : "Admin"}</p>
            <Link href="/dashboard/admin"
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/dashboard/admin" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                collapsed && "justify-center px-2")} title={collapsed ? "Admin Panel" : undefined}>
              <Shield className="h-5 w-5 flex-shrink-0" />
              {!collapsed && "Admin Panel"}
            </Link>
          </>
        )}
      </nav>

      <div className="border-t p-3 space-y-1 dark:border-gray-700/60">
        {!collapsed && (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Theme</span>
            <ThemeToggle />
          </div>
        )}
        <button onClick={() => signOut({ callbackUrl: "/" })}
          className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200", collapsed && "justify-center")}
          title={collapsed ? "Sign out" : undefined}>
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  )
}

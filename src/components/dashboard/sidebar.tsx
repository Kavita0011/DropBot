"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MessageSquare, LayoutDashboard, Bot, CreditCard, Settings, LogOut, ChevronLeft } from "lucide-react"
import { signOut } from "next-auth/react"

const userLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/chatbots", label: "Chatbots", icon: Bot },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const adminLinks = [
  { href: "/dashboard/admin", label: "Admin Panel", icon: Settings },
]

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/dashboard/admin")

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <Link href="/" className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
          <MessageSquare className="h-6 w-6 text-blue-600 flex-shrink-0" />
          {!collapsed && <span className="font-bold text-gray-900">DropBot</span>}
        </Link>
        <button
          onClick={onToggle}
          className={cn("rounded-lg p-1.5 text-gray-400 hover:bg-gray-100", collapsed && "hidden")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <p className={cn("px-3 text-xs font-semibold uppercase text-gray-400", collapsed && "text-center")}>
          {collapsed ? "..." : "Main"}
        </p>
        {userLinks.map((link) => {
          const Icon = link.icon
          const active = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? link.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && link.label}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-gray-100" />
            <p className={cn("px-3 text-xs font-semibold uppercase text-gray-400", collapsed && "text-center")}>
              {collapsed ? "..." : "Admin"}
            </p>
            {adminLinks.map((link) => {
              const Icon = link.icon
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && link.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  )
}

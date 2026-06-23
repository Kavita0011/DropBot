import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dropbot.ai"

export const metadata: Metadata = {
  title: {
    template: "%s | DropBot",
    default: "Account - DropBot",
  },
  description: "Sign in to your DropBot account or create a new account. Build and manage your AI chatbots.",
  robots: { index: false, follow: false },
  alternates: { canonical: baseUrl },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      {children}
    </div>
  )
}

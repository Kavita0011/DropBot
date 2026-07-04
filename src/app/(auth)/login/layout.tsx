import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dropbot.ai"

export const metadata: Metadata = {
  title: "Sign In - AI Chatbot Builder",
  description:
    "Sign in to your DropBot account to build, customize, and deploy AI chatbots on your website with our drag-and-drop no-code builder.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${baseUrl}/login` },
  openGraph: {
    url: `${baseUrl}/login`,
    title: "Sign In - DropBot",
    description: "Sign in to your DropBot account to build AI chatbots with drag & drop.",
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}

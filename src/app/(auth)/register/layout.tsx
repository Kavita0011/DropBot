import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dropbot.ai"

export const metadata: Metadata = {
  title: "Create Account - AI Chatbot Builder",
  description:
    "Create your free DropBot account and start building AI chatbots with our drag-and-drop no-code builder. Deploy on any website in minutes.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${baseUrl}/register` },
  openGraph: {
    url: `${baseUrl}/register`,
    title: "Create Account - DropBot",
    description: "Create your free DropBot account and build AI chatbots in minutes.",
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}

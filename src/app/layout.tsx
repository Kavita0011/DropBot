import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dropbot.ai"

export const metadata: Metadata = {
  title: {
    default: "DropBot - AI Chatbot Builder | Drag & Drop No-Code Platform",
    template: "%s | DropBot",
  },
  description:
    "Build intelligent AI chatbots with drag and drop. No coding required. Create custom conversational flows, embed on any website, and engage visitors 24/7.",
  keywords: [
    "chatbot builder", "AI chatbot", "drag and drop chatbot", "no-code chatbot",
    "conversational AI", "website chatbot", "customer support bot", "chatbot creator",
    "build chatbot online", "free chatbot builder",
  ],
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "DropBot",
    title: "DropBot - AI Chatbot Builder",
    description: "Build intelligent chatbots with drag & drop. No coding required.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DropBot - AI Chatbot Builder",
    description: "Build intelligent chatbots with drag & drop. No coding required.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: baseUrl },
  icons: {
    icon: [{ url: "/icon-192.svg", type: "image/svg+xml" }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

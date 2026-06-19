import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Script from "next/script"
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
    images: [{ url: "/og-image.svg", width: 1200, height: 630, type: "image/svg+xml" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DropBot - AI Chatbot Builder",
    description: "Build intelligent chatbots with drag & drop. No coding required.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon-192.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "DropBot",
      url: baseUrl,
      logo: `${baseUrl}/icon-512.svg`,
      description: "Build intelligent AI chatbots with drag and drop. No coding required.",
      foundingDate: "2024",
      contactPoint: { "@type": "ContactPoint", email: "devappkavita@gmail.com", contactType: "support" },
    },
    {
      "@type": "WebSite",
      url: baseUrl,
      name: "DropBot - AI Chatbot Builder",
      description: "Build intelligent AI chatbots with drag and drop. No coding required.",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${baseUrl}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "DropBot",
      operatingSystem: "Web",
      applicationCategory: "BusinessApplication",
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
        { "@type": "Offer", name: "Pro", price: "29", priceCurrency: "USD" },
        { "@type": "Offer", name: "Business", price: "99", priceCurrency: "USD" },
      ],
      description: "No-code AI chatbot builder with drag-and-drop interface.",
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <Script defer data-domain="dropbot.ai" src="https://plausible.io/js/script.js" strategy="afterInteractive" />
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t!="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`}
        </Script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

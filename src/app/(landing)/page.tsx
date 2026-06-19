import type { Metadata } from "next"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { StatsSection } from "@/components/landing/stats-section"
import { Testimonials } from "@/components/landing/testimonials"
import { PricingSection } from "@/components/landing/pricing-section"
import { FAQ } from "@/components/landing/faq"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dropbot.ai"

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
  ],
}

export const metadata: Metadata = {
  title: "AI Chatbot Builder - Drag & Drop No-Code Platform",
  description:
    "Build intelligent AI chatbots with drag and drop. No coding required. Create custom conversational flows, embed on any website, and engage visitors 24/7.",
  openGraph: {
    title: "DropBot - AI Chatbot Builder | Drag & Drop No-Code Platform",
    description: "Build intelligent chatbots with drag & drop. No coding required.",
    url: baseUrl,
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
  alternates: { canonical: baseUrl },
}

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Hero />
      <StatsSection />
      <Features />
      <Testimonials />
      <PricingSection />
      <FAQ />
    </>
  )
}

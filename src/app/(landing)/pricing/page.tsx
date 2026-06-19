import type { Metadata } from "next"
import { PricingSection } from "@/components/landing/pricing-section"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dropbot.ai"

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Pricing", item: `${baseUrl}/pricing` },
  ],
}

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for teams of all sizes. Free plan available. Upgrade as you grow.",
  openGraph: {
    title: "DropBot Pricing - Simple, Transparent Plans",
    description: "Start free, upgrade as you grow.",
    url: `${baseUrl}/pricing`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
  alternates: { canonical: `${baseUrl}/pricing` },
}

export default function PricingPage() {
  return (
    <div className="pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Simple, transparent pricing</h1>
        <p className="mt-4 text-lg text-gray-500">Start free, scale as you grow. No hidden fees.</p>
      </div>
      <PricingSection />
    </div>
  )
}

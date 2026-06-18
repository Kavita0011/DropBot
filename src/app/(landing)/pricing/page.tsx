import type { Metadata } from "next"
import { PricingSection } from "@/components/landing/pricing-section"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for teams of all sizes. Free plan available. Upgrade as you grow.",
  openGraph: { title: "DropBot Pricing - Simple, Transparent Plans", description: "Start free, upgrade as you grow." },
}

export default function PricingPage() {
  return (
    <div className="pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Simple, transparent pricing</h1>
        <p className="mt-4 text-lg text-gray-500">Start free, scale as you grow. No hidden fees.</p>
      </div>
      <PricingSection />
    </div>
  )
}

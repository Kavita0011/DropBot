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
      <PricingSection />
    </div>
  )
}

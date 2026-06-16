import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { StatsSection } from "@/components/landing/stats-section"
import { Testimonials } from "@/components/landing/testimonials"
import { PricingSection } from "@/components/landing/pricing-section"

export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <Features />
      <Testimonials />
      <PricingSection />
    </>
  )
}

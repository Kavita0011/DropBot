import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dropbot.ai"

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Refund Policy", item: `${baseUrl}/refund-policy` },
  ],
}

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "DropBot refund policy. Understand our refund terms for subscription payments and how to request a refund.",
  openGraph: {
    title: "Refund Policy | DropBot",
    description: "DropBot refund policy - understand our refund terms for subscription payments.",
    url: `${baseUrl}/refund-policy`,
  },
  alternates: { canonical: `${baseUrl}/refund-policy` },
}

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
        <p><strong>Last updated:</strong> June 16, 2026</p>

        <h2 className="text-xl font-semibold mt-8">1. Subscription Payments</h2>
        <p>All subscription payments are non-refundable. If you cancel your subscription, you will continue to have access to the paid features until the end of your current billing period.</p>

        <h2 className="text-xl font-semibold mt-8">2. Free Trial</h2>
        <p>We offer a free plan that allows you to test the Service before committing to a paid subscription. We encourage you to evaluate the free plan thoroughly before upgrading.</p>

        <h2 className="text-xl font-semibold mt-8">3. Billing Errors</h2>
        <p>If you believe you have been charged incorrectly, please contact us within 30 days of the charge at <a href="mailto:devappkavita@gmail.com" className="text-blue-600 hover:underline">devappkavita@gmail.com</a>. We will investigate and issue a refund if an error is confirmed.</p>

        <h2 className="text-xl font-semibold mt-8">4. Service Downtime</h2>
        <p>In the event of extended Service downtime caused by our infrastructure, we may issue partial or full refunds at our discretion on a case-by-case basis.</p>

        <h2 className="text-xl font-semibold mt-8">5. How to Request a Refund</h2>
        <p>Email us at <a href="mailto:devappkavita@gmail.com" className="text-blue-600 hover:underline">devappkavita@gmail.com</a> with your account email and a description of the issue. We aim to respond within 2 business days.</p>

        <h2 className="text-xl font-semibold mt-8">6. Chargebacks</h2>
        <p>If you dispute a charge through your bank or credit card provider without first contacting us, your account may be suspended until the dispute is resolved.</p>
      </div>
    </div>
  )
}
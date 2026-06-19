import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dropbot.ai"

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Terms & Conditions", item: `${baseUrl}/terms` },
  ],
}

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "DropBot terms and conditions. Learn about the rules and guidelines for using our AI chatbot builder platform.",
  openGraph: {
    title: "Terms & Conditions | DropBot",
    description: "DropBot terms and conditions - rules and guidelines for using our AI chatbot builder platform.",
    url: `${baseUrl}/terms`,
  },
  alternates: { canonical: `${baseUrl}/terms` },
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <h1 className="text-3xl font-bold mb-8">Terms &amp; Conditions</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
        <p><strong>Last updated:</strong> June 16, 2026</p>

        <h2 className="text-xl font-semibold mt-8">1. Acceptance of Terms</h2>
        <p>By accessing or using DropBot (&quot;the Service&quot;), you agree to be bound by these Terms &amp; Conditions. If you do not agree, do not use the Service.</p>

        <h2 className="text-xl font-semibold mt-8">2. Description of Service</h2>
        <p>DropBot provides an AI chatbot builder platform that allows users to create, customize, and embed chatbots on their websites.</p>

        <h2 className="text-xl font-semibold mt-8">3. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate, current, and complete information during registration.</p>

        <h2 className="text-xl font-semibold mt-8">4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to circumvent usage limits or security measures</li>
          <li>Upload or generate content that is harmful, harassing, or deceptive</li>
          <li>Reverse engineer or modify the platform without authorization</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">5. Payment Terms</h2>
        <p>Paid plans are billed in advance on a monthly basis. Payments are processed securely through Razorpay via credit/debit cards, UPI, net banking, and wallets. All payments are non-refundable except as outlined in our Refund Policy.</p>

        <h2 className="text-xl font-semibold mt-8">6. Cancellation</h2>
        <p>You may cancel your subscription at any time from the billing dashboard. Your access will continue until the end of the current billing period.</p>

        <h2 className="text-xl font-semibold mt-8">7. Limitation of Liability</h2>
        <p>DropBot is provided &quot;as is&quot; without warranty of any kind. We are not liable for any damages arising from your use of the Service.</p>

        <h2 className="text-xl font-semibold mt-8">8. Changes to Terms</h2>
        <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>

        <h2 className="text-xl font-semibold mt-8">9. Contact</h2>
        <p>For questions about these terms, contact us at <a href="mailto:devappkavita@gmail.com" className="text-blue-600 hover:underline">devappkavita@gmail.com</a>.</p>
      </div>
    </div>
  )
}
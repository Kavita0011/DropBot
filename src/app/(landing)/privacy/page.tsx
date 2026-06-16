export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
        <p><strong>Last updated:</strong> June 16, 2026</p>

        <h2 className="text-xl font-semibold mt-8">1. Information We Collect</h2>
        <p>We collect information you provide when creating an account, including your name, email address, and billing information (processed by Stripe, not stored by us).</p>
        <p>We also collect usage data such as chatbot interactions, page views, and feature usage to improve our Service.</p>

        <h2 className="text-xl font-semibold mt-8">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To provide, maintain, and improve the Service</li>
          <li>To process transactions and send billing notifications</li>
          <li>To communicate with you about your account and updates</li>
          <li>To detect and prevent abuse or unauthorized use</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">3. Data Storage &amp; Security</h2>
        <p>Your data is stored securely using industry-standard encryption. Passwords are hashed using bcrypt. We implement rate limiting, security headers, and input validation to protect against common attacks.</p>

        <h2 className="text-xl font-semibold mt-8">4. Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Stripe</strong> — payment processing (see their <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>)</li>
          <li><strong>OpenAI</strong> — AI chatbot responses (if enabled)</li>
          <li><strong>Neon</strong> — database hosting</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">5. Data Retention</h2>
        <p>We retain your data for as long as your account is active. Upon account deletion, your data is permanently removed within 30 days.</p>

        <h2 className="text-xl font-semibold mt-8">6. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data at any time from your account settings. You may also request a copy of your data by contacting us.</p>

        <h2 className="text-xl font-semibold mt-8">7. Cookies</h2>
        <p>We use essential cookies for authentication and session management. No tracking cookies are used.</p>

        <h2 className="text-xl font-semibold mt-8">8. Contact</h2>
        <p>For privacy-related inquiries, contact us at <a href="mailto:support@dropbot.ai" className="text-blue-600 hover:underline">support@dropbot.ai</a>.</p>
      </div>
    </div>
  )
}
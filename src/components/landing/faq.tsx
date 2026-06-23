const faqs = [
  { q: "What is DropBot?", a: "DropBot is a no-code AI chatbot builder that lets you create intelligent conversational agents using a drag-and-drop interface. No coding or technical skills required." },
  { q: "How does the drag-and-drop builder work?", a: "Simply drag nodes onto the canvas, connect them to create conversation flows, and customize each node's behavior. It's as easy as drawing a flowchart." },
  { q: "Can I embed the chatbot on my website?", a: "Yes. Once you build your chatbot, we give you a single line of JavaScript code. Copy-paste it into your website's HTML and the chatbot appears instantly." },
  { q: "Is there a free plan?", a: "Yes, we offer a generous free plan that includes basic features, a limited number of conversations, and standard embedding. Upgrade to paid plans for more." },
  { q: "Which payment methods do you accept?", a: "We accept Razorpay for all payments. You can pay via credit/debit cards, UPI, net banking, and wallets — all processed securely through Razorpay." },
  { q: "Do I need an OpenAI API key?", a: "No, DropBot works out of the box. If you want to use your own OpenAI key for advanced customization, you can optionally connect it in settings." },
]

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
}

export function FAQ() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="border-t border-gray-100 dark:border-gray-800 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">Frequently asked questions</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Everything you need to know about DropBot.</p>
          </div>
          <div className="mx-auto mt-16 max-w-3xl divide-y divide-gray-200 dark:divide-gray-700">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-5 cursor-pointer">
                <summary className="flex items-center justify-between text-base font-semibold text-gray-900 dark:text-gray-100 list-none">
                  {faq.q}
                  <span className="ml-6 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed pr-12">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

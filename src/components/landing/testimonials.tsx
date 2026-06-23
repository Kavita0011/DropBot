import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  { name: "Sarah Chen", role: "Founder, TechStart", content: "DropBot cut our support response time by 80%. The drag-and-drop builder is incredible — I built a full support bot in under an hour.", rating: 5 },
  { name: "Marcus Johnson", role: "Marketing Director", content: "We replaced three different tools with DropBot. The AI responses are scarily accurate and our visitors love the instant replies.", rating: 5 },
  { name: "Priya Patel", role: "SaaS Founder", content: "The embed was literally copy-paste. Had our chatbot live on the site in 2 minutes. Best decision we made this quarter.", rating: 5 },
]

export function Testimonials() {
  return (
      <section className="border-t border-gray-100 dark:border-gray-800 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">Loved by founders</h2>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">See what our users are saying.</p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-0 bg-gray-50/80 dark:bg-gray-800/50">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">&ldquo;{t.content}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

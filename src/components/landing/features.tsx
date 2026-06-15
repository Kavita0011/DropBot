import { Card, CardContent } from "@/components/ui/card"
import { MousePointerClick, Brain, Palette, Globe, Zap, Shield } from "lucide-react"

const features = [
  {
    icon: MousePointerClick,
    title: "Drag & Drop Builder",
    description: "Design conversational flows visually. Just drag, drop, and connect nodes to build complex chatbot logic.",
  },
  {
    icon: Brain,
    title: "AI-Powered",
    description: "Leverage AI to understand user intent and generate intelligent responses automatically.",
  },
  {
    icon: Palette,
    title: "Customizable Design",
    description: "Match your brand with custom colors, fonts, and chat bubble styles. Full control over appearance.",
  },
  {
    icon: Globe,
    title: "Easy Embedding",
    description: "Embed your chatbot on any website with a single line of code. Works with any platform.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for performance. Your chatbot loads instantly and doesn't slow down your site.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security. Your data is encrypted and your chatbot is always available.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-t border-gray-100 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to build chatbots
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Powerful features that make creating AI chatbots effortless.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 bg-gray-50">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

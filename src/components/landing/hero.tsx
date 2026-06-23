import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, Sparkles, CheckCircle, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-24 sm:pt-36 sm:pb-32">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute top-[-20%] right-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 animate-fade-in">
            <Sparkles className="h-4 w-4" /> AI-Powered Chatbot Builder
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-7xl leading-[1.1]">
            Build Intelligent Chatbots with{" "}
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Drag & Drop
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Create powerful AI chatbots in minutes — no coding required. Design conversational flows visually,
            customize every detail, and embed on your website with one line of code.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2 h-12 px-8 text-base shadow-lg shadow-blue-200 hover:shadow-xl transition-shadow">
              <Link href="/register">Start Building Free <ArrowRight className="h-5 w-5" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
              <Link href="#features">See How It Works</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
            {[
              { icon: CheckCircle, text: "No coding" },
              { icon: Zap, text: "AI-powered" },
              { icon: Bot, text: "One-click embed" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-blue-500" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

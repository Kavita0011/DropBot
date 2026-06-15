import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-purple-400/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" />
            AI-Powered Chatbot Builder
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Build Intelligent Chatbots with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Drag & Drop
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Create powerful AI chatbots without coding. Design conversational flows visually,
            customize responses, and embed them on your website in minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/register">
                Start Building Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">See Features</Link>
            </Button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <span>No coding required</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <span>AI-powered responses</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <span>Easy embed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

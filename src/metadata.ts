import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dropbot.ai"

export function landingMetadata(override?: Partial<Metadata>): Metadata {
  return {
    title: { default: "DropBot - AI Chatbot Builder | Drag & Drop No-Code Platform", template: "%s | DropBot" },
    description: "Build intelligent AI chatbots with drag and drop. No coding required. Create custom conversational flows, embed on any website, and engage visitors 24/7.",
    keywords: ["chatbot builder", "AI chatbot", "drag and drop chatbot", "no-code chatbot", "conversational AI", "website chatbot", "free chatbot builder"],
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: "website", locale: "en_US", url: baseUrl, siteName: "DropBot",
      title: "DropBot - AI Chatbot Builder",
      description: "Build intelligent chatbots with drag & drop. No coding required.",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    ...override,
  }
}

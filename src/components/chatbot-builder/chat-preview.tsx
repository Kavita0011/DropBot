"use client"

import { useState } from "react"
import { useChatbotStore } from "@/store/chatbot-store"
import { cn } from "@/lib/utils"
import type { FlowNode } from "@/types"
import { MessageSquare, Send } from "lucide-react"

export function ChatPreview() {
  const { nodes, welcomeMsg, themeColor, bgColor, textColor } = useChatbotStore()
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([])
  const [input, setInput] = useState("")
  const [step, setStep] = useState(0)

  const startChat = () => {
    setMessages([{ role: "bot", text: welcomeMsg }])
    setStep(1)
  }

  const handleSend = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { role: "user", text: input }])
    setInput("")

    setTimeout(() => {
      const nextNode = nodes[step] as FlowNode | undefined
      if (nextNode?.type === "message" || nextNode?.type === "welcome") {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: (nextNode.data.message as string) || "Thanks for your response!" },
        ])
        setStep((s) => Math.min(s + 1, nodes.length - 1))
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "Got it! Is there anything else I can help with?" },
        ])
      }
    }, 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex h-full flex-col rounded-xl border shadow-sm overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ backgroundColor: themeColor }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white">Chat Preview</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <button
              onClick={startChat}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              Start Preview
            </button>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                  msg.role === "user"
                    ? "rounded-br-md text-white"
                    : "rounded-bl-md bg-gray-100"
                )}
                style={
                  msg.role === "user"
                    ? { backgroundColor: themeColor, color: "#fff" }
                    : { color: textColor }
                }
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      {messages.length > 0 && (
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <button
              onClick={handleSend}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

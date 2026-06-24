"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { MessageSquare, Send, X } from "lucide-react"

interface ChatbotData {
  id: string
  name: string
  welcomeMsg: string
  themeColor: string
  bgColor: string
  textColor: string
  position: string
  logoUrl: string | null
}

export default function EmbedPage() {
  const params = useParams()
  const chatbotId = params.chatbotId as string
  const [chatbot, setChatbot] = useState<ChatbotData | null>(null)
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)

  const getParam = (key: string) => typeof window !== "undefined" ? new URL(window.location.href).searchParams.get(key) : null
  const overrides = {
    themeColor: getParam("themeColor"),
    title: getParam("title"),
    bgColor: getParam("bgColor"),
    textColor: getParam("textColor"),
  }

  useEffect(() => {
    fetch(`/api/embed/${chatbotId}`)
      .then((res) => res.json())
      .then((data) => {
        setChatbot(data)
        setMessages([{ role: "bot", text: data.welcomeMsg || "Hi! How can I help?" }])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [chatbotId])

  const postMessage = useCallback((payload: { role: string; content: string }) => {
    try { window.parent.postMessage({ type: "db-message", payload }, "*") } catch {}
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input
    setInput("")
    setMessages((prev) => [...prev, { role: "user", text: userMsg }])
    postMessage({ role: "user", content: userMsg })

    try {
      const res = await fetch(`/api/chat/${chatbotId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      const reply = data.reply || "Sorry, I couldn't process that."
      setMessages((prev) => [...prev, { role: "bot", text: reply }])
      postMessage({ role: "assistant", content: reply })
    } catch {
      const err = "Sorry, something went wrong."
      setMessages((prev) => [...prev, { role: "bot", text: err }])
      postMessage({ role: "assistant", content: err })
    }
  }

  if (loading) return <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "14px", fontFamily: "system-ui, sans-serif" }}>Loading...</div>
  if (!chatbot) return <div style={{ padding: "16px", color: "#ef4444", fontSize: "14px", fontFamily: "system-ui, sans-serif" }}>Chatbot not found</div>

  const themeColor = overrides.themeColor || chatbot.themeColor
  const bgColor = overrides.bgColor || chatbot.bgColor
  const textColor = overrides.textColor || chatbot.textColor
  const title = overrides.title || chatbot.name

  return (
    <div style={{
      fontFamily: "system-ui, sans-serif",
      margin: 0, padding: 0, height: "100%", width: "100%",
      backgroundColor: bgColor,
    }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{
          backgroundColor: themeColor, padding: "16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "white" }}>
            {chatbot.logoUrl && /^(https?:\/\/|\/uploads\/)/.test(chatbot.logoUrl) ? (
              <img src={chatbot.logoUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "contain" }} />
            ) : (
              <MessageSquare className="h-5 w-5" />
            )}
            <span style={{ fontWeight: 600, fontSize: "14px" }}>{title}</span>
          </div>
        </div>

        <div style={{
          flex: 1, overflowY: "auto", padding: "16px",
          display: "flex", flexDirection: "column", gap: "8px", minHeight: 0,
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "8px 16px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                backgroundColor: msg.role === "user" ? themeColor : "#f3f4f6",
                color: msg.role === "user" ? "white" : textColor,
                fontSize: "14px", lineHeight: "1.5", wordBreak: "break-word",
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          borderTop: "1px solid #e5e7eb", padding: "12px",
          display: "flex", gap: "8px", flexShrink: 0,
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            style={{
              flex: 1, padding: "8px 16px", borderRadius: "8px",
              border: "1px solid #d1d5db", outline: "none", fontSize: "14px",
            }}
          />
          <button
            onClick={handleSend}
            style={{
              width: "36px", height: "36px", borderRadius: "8px",
              backgroundColor: themeColor, color: "white",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

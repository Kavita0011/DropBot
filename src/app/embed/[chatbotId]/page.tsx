"use client"

import { useEffect, useState } from "react"
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
  status: string
  logoUrl: string | null
}

export default function EmbedPage() {
  const params = useParams()
  const chatbotId = params.chatbotId as string
  const [chatbot, setChatbot] = useState<ChatbotData | null>(null)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/embed/${chatbotId}`)
      .then((res) => res.json())
      .then((data) => {
        setChatbot(data)
        if (data.status !== "draft") {
          setMessages([{ role: "bot", text: data.welcomeMsg }])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [chatbotId])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input
    setInput("")
    setMessages((prev) => [...prev, { role: "user", text: userMsg }])

    try {
      const res = await fetch(`/api/chat/${chatbotId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Sorry, something went wrong." }])
    }
  }

  if (loading) return null
  if (!chatbot) return <div className="p-4 text-sm text-red-500">Chatbot not found</div>

  const positionStyle = chatbot.position === "bottom-left"
    ? { left: "20px", bottom: "20px" }
    : { right: "20px", bottom: "20px" }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            ...positionStyle,
            position: "fixed",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: chatbot.themeColor,
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      ) : (
        <div
          style={{
            ...positionStyle,
            position: "fixed",
            width: "380px",
            height: "600px",
            maxHeight: "calc(100vh - 40px)",
            backgroundColor: chatbot.bgColor,
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: chatbot.themeColor,
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "white" }}>
              {chatbot.logoUrl ? (
                <img src={chatbot.logoUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "contain" }} />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              <span style={{ fontWeight: 600, fontSize: "14px" }}>{chatbot.name}</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "8px 16px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    backgroundColor: msg.role === "user" ? chatbot.themeColor : "#f3f4f6",
                    color: msg.role === "user" ? "white" : chatbot.textColor,
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px", display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: "14px",
              }}
            />
            <button
              onClick={handleSend}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: chatbot.themeColor,
                color: "white",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

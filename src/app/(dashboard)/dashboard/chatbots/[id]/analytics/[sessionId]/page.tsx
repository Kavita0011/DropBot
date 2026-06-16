"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
}

interface SessionDetail {
  id: string
  createdAt: string
  messages: Message[]
}

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const chatbotId = params.id as string
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/chatsessions/${sessionId}`)
      .then((r) => { if (!r.ok) throw Error(); return r.json() })
      .then(setSession)
      .catch(() => router.push(`/dashboard/chatbots/${chatbotId}/analytics`))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Conversation</h1>
          <p className="text-sm text-gray-500 mt-1">{session ? new Date(session.createdAt).toLocaleString() : ""}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {session?.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user" ? "bg-blue-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {session?.messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No messages in this session.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

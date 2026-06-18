"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Bot, ChevronLeft, ChevronRight } from "lucide-react"
import { ChatbotCard } from "@/components/dashboard/chatbot-card"
import type { ChatbotData } from "@/types"

const PER_PAGE = 10

export default function ChatbotsPage() {
  const [chatbots, setChatbots] = useState<ChatbotData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetch("/api/chatbots")
      .then((res) => res.json())
      .then(setChatbots)
      .finally(() => setLoading(false))
  }, [])

  const totalPages = Math.max(1, Math.ceil(chatbots.length / PER_PAGE))
  const paginated = chatbots.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  useEffect(() => {
    setPage(0)
  }, [chatbots.length])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Chatbots</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your chatbot creations</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/chatbots/new"><Plus className="h-4 w-4" /> New Chatbot</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : chatbots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bot className="mb-4 h-16 w-16 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No chatbots yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first chatbot to get started.</p>
          <Button asChild className="mt-4 gap-2">
            <Link href="/dashboard/chatbots/new"><Plus className="h-4 w-4" /> Create Chatbot</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((c) => <ChatbotCard key={c.id} chatbot={c} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
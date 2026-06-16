"use client"

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bot, Edit, Eye, ExternalLink, Trash2, BarChart3 } from "lucide-react"
import type { ChatbotData } from "@/types"
import toast from "react-hot-toast"

interface ChatbotCardProps {
  chatbot: ChatbotData
}

export function ChatbotCard({ chatbot }: ChatbotCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Delete this chatbot? This cannot be undone.")) return
    setDeleting(true)
    const res = await fetch(`/api/chatbots/${chatbot.id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Deleted!"); router.refresh() }
    else toast.error("Failed to delete")
    setDeleting(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">{chatbot.name}</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">{chatbot.description || "No description"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={chatbot.status === "approved" ? "success" : chatbot.status === "pending_review" ? "warning" : "secondary"}>
            {chatbot.status === "approved" ? "Published" : chatbot.status === "pending_review" ? "Review" : "Draft"}
          </Badge>
          <button onClick={handleDelete} disabled={deleting} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Updated {new Date(chatbot.updatedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild variant="default" size="sm" className="gap-1">
          <Link href={`/dashboard/chatbots/${chatbot.id}`}><Edit className="h-3.5 w-3.5" /> Edit</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link href={`/dashboard/chatbots/${chatbot.id}/embed`}><Eye className="h-3.5 w-3.5" /> Embed</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href={`/embed/${chatbot.id}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href={`/dashboard/chatbots/${chatbot.id}/analytics`}><BarChart3 className="h-3.5 w-3.5" /></Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

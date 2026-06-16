"use client"

import { useEffect, useState, lazy, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { useChatbotStore } from "@/store/chatbot-store"
import toast from "react-hot-toast"

const BuilderWorkspace = lazy(() =>
  import("@/components/chatbot-builder/builder-workspace").then((m) => ({ default: m.BuilderWorkspace }))
)

export default function ChatbotEditorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const store = useChatbotStore()

  useEffect(() => {
    fetch(`/api/chatbots/${id}`)
      .then((res) => { if (!res.ok) throw Error(); return res.json() })
      .then((data) => {
        store.loadFromFlowData(data.flowData, {
          name: data.name, description: data.description, welcomeMsg: data.welcomeMsg,
          themeColor: data.themeColor, accentColor: data.accentColor, position: data.position,
          bgColor: data.bgColor, textColor: data.textColor, status: data.status,
        })
      })
      .catch(() => { toast.error("Chatbot not found"); router.push("/dashboard/chatbots") })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
  }

  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <BuilderWorkspace chatbotId={id} onBack={() => router.push("/dashboard/chatbots")} />
    </Suspense>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, MessageCircle, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface AnalyticsData {
  totalSessions: number
  todaySessions: number
  totalMessages: number
  recentSessions: { id: string; createdAt: string; _count: { messages: number } }[]
}

export default function AnalyticsPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/chatbots/${id}/analytics`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/chatbots" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Chat Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Conversation history and metrics.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{data?.totalSessions ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today</CardTitle>
            <MessageCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{data?.todaySessions ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{data?.totalMessages ?? 0}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader>
        <CardContent>
          {data?.recentSessions?.length ? (
            <div className="space-y-2">
              {data.recentSessions.map((s) => (
                <Link key={s.id} href={`/dashboard/chatbots/${id}/analytics/${s.id}`}>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm hover:bg-gray-100 transition-colors cursor-pointer">
                    <span className="text-gray-600">{new Date(s.createdAt).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{s._count.messages} msgs</Badge>
                      <span className="text-xs text-gray-400">View →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No conversations yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

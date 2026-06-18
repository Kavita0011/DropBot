"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Plus, MessageSquare, TrendingUp, BarChart3 } from "lucide-react"
import toast from "react-hot-toast"

interface DashboardStats {
  totalChatbots: number
  totalNodes: number
  totalChats: number
  todayChats: number
  plan: string
  planLimit: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => { toast.error("Failed to load dashboard stats") })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {session?.user?.name || session?.user?.email}</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/chatbots/new"><Plus className="h-4 w-4" /> New Chatbot</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Chatbots</CardTitle>
            <Bot className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{loading ? "..." : stats?.totalChatbots ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">of {stats?.planLimit ?? 1} limit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Nodes</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{loading ? "..." : stats?.totalNodes ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">All-Time Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{loading ? "..." : stats?.totalChats ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today / Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{loading ? "..." : stats?.plan ?? "Free"}</p>
            <p className="text-xs text-gray-400 mt-1">{stats?.todayChats ?? 0} chats today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Chatbots</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
          ) : (stats?.totalChatbots ?? 0) > 0 ? (
            <p className="text-sm text-gray-500">View your chatbots in the Chatbots section.</p>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No chatbots yet</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first chatbot to get started.</p>
              <Button asChild className="mt-4 gap-2">
                <Link href="/dashboard/chatbots/new"><Plus className="h-4 w-4" /> Create Chatbot</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

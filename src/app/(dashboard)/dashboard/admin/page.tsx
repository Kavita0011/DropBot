"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Bot, CreditCard, TrendingUp } from "lucide-react"

interface AdminStats {
  totalUsers: number; totalChatbots: number; totalPayments: number; totalRevenue: number
  recentUsers: { id: string; name: string | null; email: string; createdAt: string }[]
  recentChatbots: { id: string; name: string; userId: string; createdAt: string }[]
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats").then((res) => res.json()).then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and management.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-600" },
          { label: "Total Chatbots", value: stats?.totalChatbots, icon: Bot, color: "text-green-600" },
          { label: "Payments", value: stats?.totalPayments, icon: CreditCard, color: "text-purple-600" },
          { label: "Revenue", value: `$${stats?.totalRevenue ?? "0"}`, icon: TrendingUp, color: "text-orange-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{item.label}</CardTitle>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{item.value ?? "-"}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
          <CardContent>
            {stats?.recentUsers?.length ? (
              <ul className="space-y-3">{stats.recentUsers.map((u) => <li key={u.id} className="flex items-center justify-between text-sm"><span>{u.name || u.email}</span><span className="text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</span></li>)}</ul>
            ) : <p className="text-sm text-gray-400">No users yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Chatbots</CardTitle></CardHeader>
          <CardContent>
            {stats?.recentChatbots?.length ? (
              <ul className="space-y-3">{stats.recentChatbots.map((b) => <li key={b.id} className="flex items-center justify-between text-sm"><span>{b.name}</span><span className="text-gray-500 text-xs">{new Date(b.createdAt).toLocaleDateString()}</span></li>)}</ul>
            ) : <p className="text-sm text-gray-400">No chatbots yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

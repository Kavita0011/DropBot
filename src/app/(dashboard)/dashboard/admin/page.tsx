"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Users, Bot, CreditCard, TrendingUp, ShieldCheck, ShieldX, Search, Loader2,
  LayoutDashboard, UserCog, MessageSquare, DollarSign, CheckCircle, XCircle,
  Clock, ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, Tag
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts"
import toast from "react-hot-toast"

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: UserCog },
  { key: "chatbots", label: "Chatbots", icon: MessageSquare },
  { key: "moderation", label: "Moderation", icon: ShieldCheck },
  { key: "pricing", label: "Pricing", icon: Tag },
  { key: "transactions", label: "Payments", icon: DollarSign },
] as const

interface AdminStats {
  totalUsers: number; totalChatbots: number; totalPayments: number; totalRevenue: number
  recentUsers: { id: string; name: string | null; email: string; createdAt: string }[]
  recentChatbots: { id: string; name: string; userId: string; createdAt: string; status: string }[]
}

interface AdminUser {
  id: string; name: string | null; email: string; role: string; createdAt: string
  _count: { chatbots: number; payments: number }
}

interface AdminChatbot {
  id: string; name: string; description: string; status: string; createdAt: string; updatedAt: string
  user: { id: string; name: string | null; email: string }
}

interface PendingChatbot {
  id: string; name: string; description: string; status: string; updatedAt: string
  user: { id: string; name: string | null; email: string }
}

const PAGE_SIZE = 10

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<string>("dashboard")
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [chatbots, setChatbots] = useState<AdminChatbot[]>([])
  const [pending, setPending] = useState<PendingChatbot[]>([])
  const [loading, setLoading] = useState(true)
  const [moderating, setModerating] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState("")
  const [chatbotSearch, setChatbotSearch] = useState("")
  const [chatbotFilter, setChatbotFilter] = useState<string>("all")
  const [userPage, setUserPage] = useState(0)
  const [chatbotPage, setChatbotPage] = useState(0)
  const [plans, setPlans] = useState<any[]>([])
  const [editingPlan, setEditingPlan] = useState<any | null>(null)
  const [showPlanForm, setShowPlanForm] = useState(false)

  const isAdmin = (session?.user as { role?: string })?.role === "admin"

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return }
    if (status === "authenticated" && !isAdmin) { router.push("/dashboard"); return }
    if (!isAdmin) return

    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/chatbots").then((r) => r.json()),
      fetch("/api/admin/moderation").then((r) => r.json()),
      fetch("/api/admin/plans").then((r) => r.json()),
    ]).then(([s, u, c, p, pl]) => { setStats(s); setUsers(u); setChatbots(c); setPending(p); setPlans(pl) })
      .catch(() => toast.error("Failed to load admin data"))
      .finally(() => setLoading(false))
  }, [status, isAdmin])

  const handleModerate = async (chatbotId: string, status: "approved" | "rejected") => {
    setModerating(chatbotId)
    const res = await fetch("/api/admin/moderation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatbotId, status }),
    })
    if (res.ok) {
      toast.success(status === "approved" ? "Approved!" : "Rejected")
      setPending((prev) => prev.filter((p) => p.id !== chatbotId))
    } else {
      toast.error("Failed to update")
    }
    setModerating(null)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    })
    if (res.ok) {
      toast.success("Role updated")
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    } else {
      toast.error("Failed to update role")
    }
  }

  const handleSavePlan = async (plan: any) => {
    const method = plan.id ? "PATCH" : "POST"
    const res = await fetch("/api/admin/plans", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    })
    if (res.ok) {
      toast.success(plan.id ? "Plan updated" : "Plan created")
      const updated = await res.json()
      setPlans((prev) => plan.id ? prev.map((p) => p.id === updated.id ? updated : p) : [...prev, updated])
    } else {
      toast.error("Failed to save plan")
    }
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Delete this plan?")) return
    const res = await fetch("/api/admin/plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success("Plan deleted"); setPlans((prev) => prev.filter((p) => p.id !== id)) }
    else toast.error("Failed to delete plan")
  }

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users
    const q = userSearch.toLowerCase()
    return users.filter((u) => u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, userSearch])

  const paginatedUsers = filteredUsers.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE)

  const filteredChatbots = useMemo(() => {
    let result = chatbots
    if (chatbotSearch) {
      const q = chatbotSearch.toLowerCase()
      result = result.filter((b) => b.name.toLowerCase().includes(q) || b.user.name?.toLowerCase().includes(q) || b.user.email.toLowerCase().includes(q))
    }
    if (chatbotFilter !== "all") {
      result = result.filter((b) => b.status === chatbotFilter)
    }
    return result
  }, [chatbots, chatbotSearch, chatbotFilter])

  const paginatedChatbots = filteredChatbots.slice(chatbotPage * PAGE_SIZE, (chatbotPage + 1) * PAGE_SIZE)

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { draft: 0, pending_review: 0, approved: 0, rejected: 0 }
    chatbots.forEach((b) => { counts[b.status] = (counts[b.status] || 0) + 1 })
    return counts
  }, [chatbots])

  if (status === "loading" || loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Platform management and analytics.</p>
        </div>
        <Badge variant="warning" className="text-xs">Admin</Badge>
      </div>

      <div className="flex gap-1 border-b pb-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
              tab === t.key ? "bg-white text-blue-700 border-b-2 border-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            )}
          >
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Total Chatbots", value: stats?.totalChatbots ?? 0, icon: Bot, color: "text-green-600", bg: "bg-green-50" },
              { label: "Payments", value: stats?.totalPayments ?? 0, icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Revenue", value: stats?.totalRevenue ? `$${stats.totalRevenue}` : "$0", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
            ].map((item) => (
              <Card key={item.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">{item.label}</CardTitle>
                  <div className={cn("p-2 rounded-lg", item.bg)}><item.icon className={cn("h-4 w-4", item.color)} /></div>
                </CardHeader>
                <CardContent><p className="text-2xl font-bold">{item.value}</p></CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Request Volume (7d)</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ day: "Mon", chats: 48 }, { day: "Tue", chats: 72 }, { day: "Wed", chats: 61 }, { day: "Thu", chats: 85 }, { day: "Fri", chats: 94 }, { day: "Sat", chats: 55 }, { day: "Sun", chats: 42 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="chats" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Chatbots by Status</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { status: "Approved", count: statusCounts.approved || 0 },
                    { status: "Draft", count: statusCounts.draft || 0 },
                    { status: "Review", count: statusCounts.pending_review || 0 },
                    { status: "Rejected", count: statusCounts.rejected || 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {[{ fill: "#22c55e" }, { fill: "#6b7280" }, { fill: "#eab308" }, { fill: "#ef4444" }].map((entry, i) => (
                        <rect key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Users</CardTitle></CardHeader>
              <CardContent>
                {stats?.recentUsers?.length ? (
                  <div className="space-y-2">
                    {stats.recentUsers.slice(0, 5).map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                        <div><p className="font-medium text-gray-800">{u.name || "Unnamed"}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                        <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 py-4 text-center">No users yet.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Chatbots</CardTitle></CardHeader>
              <CardContent>
                {stats?.recentChatbots?.length ? (
                  <div className="space-y-2">
                    {stats.recentChatbots.slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                        <div><p className="font-medium text-gray-800">{b.name}</p></div>
                        <div className="flex items-center gap-2">
                          <Badge variant={b.status === "approved" ? "success" : b.status === "pending_review" ? "warning" : "secondary"} className="text-[10px]">{b.status}</Badge>
                          <span className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 py-4 text-center">No chatbots yet.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "users" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Users ({users.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search users..." value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(0) }} className="pl-9 h-9 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Role</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase">Chatbots</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase">Payments</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Joined</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{u.name || "Unnamed"}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px]">{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{u._count.chatbots}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{u._count.payments}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-xs border rounded-md px-2 py-1 bg-white text-gray-700 cursor-pointer hover:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredUsers.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-xs text-gray-400">{userPage * PAGE_SIZE + 1}-{Math.min((userPage + 1) * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={userPage === 0} onClick={() => setUserPage(userPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" disabled={(userPage + 1) * PAGE_SIZE >= filteredUsers.length} onClick={() => setUserPage(userPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "chatbots" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle>All Chatbots ({chatbots.length})</CardTitle>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select value={chatbotFilter} onChange={(e) => { setChatbotFilter(e.target.value); setChatbotPage(0) }} className="text-sm border rounded-md px-2 py-1.5 bg-white">
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search chatbots..." value={chatbotSearch} onChange={(e) => { setChatbotSearch(e.target.value); setChatbotPage(0) }} className="pl-9 h-9 text-sm" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Owner</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Updated</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedChatbots.map((b) => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.description || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{b.user.name || b.user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={b.status === "approved" ? "success" : b.status === "pending_review" ? "warning" : b.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">{b.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(b.updatedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {b.status === "pending_review" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600" onClick={() => handleModerate(b.id, "approved")}><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => handleModerate(b.id, "rejected")}><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginatedChatbots.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No chatbots found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredChatbots.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-xs text-gray-400">{chatbotPage * PAGE_SIZE + 1}-{Math.min((chatbotPage + 1) * PAGE_SIZE, filteredChatbots.length)} of {filteredChatbots.length}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={chatbotPage === 0} onClick={() => setChatbotPage(chatbotPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" disabled={(chatbotPage + 1) * PAGE_SIZE >= filteredChatbots.length} onClick={() => setChatbotPage(chatbotPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "moderation" && (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ShieldCheck className="h-12 w-12 mb-4 text-green-300" />
                <p className="text-lg font-medium text-gray-500">All Clear</p>
                <p className="text-sm mt-1">No chatbots pending review.</p>
              </CardContent>
            </Card>
          ) : (
            pending.map((bot) => (
              <Card key={bot.id} className="border-l-4 border-l-yellow-400">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{bot.name}</h3>
                        <Badge variant="warning" className="text-[10px]">Pending</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{bot.description || "No description"}</p>
                      <div className="flex items-center gap-4 pt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <UserCog className="h-3 w-3" /> {bot.user.name || bot.user.email}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(bot.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" className="gap-1" onClick={() => handleModerate(bot.id, "approved")} disabled={moderating === bot.id}>
                        <ShieldCheck className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleModerate(bot.id, "rejected")} disabled={moderating === bot.id}>
                        <ShieldX className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "pricing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pricing Plans ({plans.length})</h2>
            <Button size="sm" onClick={() => { setEditingPlan({ name: "", key: "", price: 0, chatbots: 1, nodes: 10, chats: 100, features: "[]", popular: false }); setShowPlanForm(true) }} className="gap-1">
              <Plus className="h-4 w-4" /> Add Plan
            </Button>
          </div>

          {showPlanForm && editingPlan && (
            <Card className="border-blue-200">
              <CardHeader><CardTitle>{editingPlan.id ? "Edit Plan" : "New Plan"}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div><label className="text-xs font-medium text-gray-500">Name</label><Input value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} className="mt-1 h-9" /></div>
                  <div><label className="text-xs font-medium text-gray-500">Key</label><Input value={editingPlan.key} onChange={(e) => setEditingPlan({ ...editingPlan, key: e.target.value })} className="mt-1 h-9" placeholder="e.g. pro" /></div>
                  <div><label className="text-xs font-medium text-gray-500">Price (cents)</label><Input type="number" value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })} className="mt-1 h-9" /></div>
                  <div><label className="text-xs font-medium text-gray-500">Price ID (Stripe)</label><Input value={editingPlan.priceId || ""} onChange={(e) => setEditingPlan({ ...editingPlan, priceId: e.target.value })} className="mt-1 h-9" /></div>
                  <div><label className="text-xs font-medium text-gray-500">Max Chatbots (-1 = unlimited)</label><Input type="number" value={editingPlan.chatbots} onChange={(e) => setEditingPlan({ ...editingPlan, chatbots: parseInt(e.target.value) || 0 })} className="mt-1 h-9" /></div>
                  <div><label className="text-xs font-medium text-gray-500">Max Nodes</label><Input type="number" value={editingPlan.nodes} onChange={(e) => setEditingPlan({ ...editingPlan, nodes: parseInt(e.target.value) || 0 })} className="mt-1 h-9" /></div>
                  <div><label className="text-xs font-medium text-gray-500">Max Chats/month</label><Input type="number" value={editingPlan.chats} onChange={(e) => setEditingPlan({ ...editingPlan, chats: parseInt(e.target.value) || 0 })} className="mt-1 h-9" /></div>
                  <div><label className="text-xs font-medium text-gray-500">Features (JSON array)</label><Input value={editingPlan.features} onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value })} className="mt-1 h-9" placeholder='["Feature 1", "Feature 2"]' /></div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={editingPlan.popular} onChange={(e) => setEditingPlan({ ...editingPlan, popular: e.target.checked })} className="rounded" /> Popular</label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={editingPlan.active !== false} onChange={(e) => setEditingPlan({ ...editingPlan, active: e.target.checked })} className="rounded" /> Active</label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => { handleSavePlan(editingPlan); setShowPlanForm(false) }}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowPlanForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Price</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase">Chatbots</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase">Nodes</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase">Chats</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Stripe ID</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plan.name}</span>
                          {plan.popular && <Badge variant="default" className="text-[10px]">Popular</Badge>}
                        </div>
                        <span className="text-xs text-gray-400">{plan.key}</span>
                      </td>
                      <td className="px-4 py-3">${plan.price === 0 ? "Free" : `$${(plan.price / 100).toFixed(2)}`}</td>
                      <td className="px-4 py-3 text-center">{plan.chatbots === -1 ? "∞" : plan.chatbots}</td>
                      <td className="px-4 py-3 text-center">{plan.nodes === -1 ? "∞" : plan.nodes}</td>
                      <td className="px-4 py-3 text-center">{plan.chats === -1 ? "∞" : plan.chats.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{plan.priceId || "—"}</td>
                      <td className="px-4 py-3 text-center"><Badge variant={plan.active ? "success" : "secondary"} className="text-[10px]">{plan.active ? "Active" : "Hidden"}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => { setEditingPlan(plan); setShowPlanForm(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => handleDeletePlan(plan.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "transactions" && (
        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            {stats?.totalPayments && stats.totalPayments > 0 ? (
              <p className="text-sm text-gray-400">Payment history will appear here as transactions are processed.</p>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">No Transactions</p>
                <p className="text-sm mt-1">Payments will show here once users start subscribing.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check, Loader2, Clock, AlertCircle, IndianRupee, Zap, FileText, Ban,
  ShieldCheck, MessageSquare, GitBranch, Users, Sparkles, ArrowRight,
  CalendarDays, CreditCard, ChevronRight, Receipt, DollarSign
} from "lucide-react"
import toast from "react-hot-toast"

interface Plan {
  id: string; key: string; name: string; price: number; priceInr: number
  priceId: string | null; features: string; popular: boolean
  chatbots: number; nodes: number; chats: number
}

interface BillingData {
  currentPlan: { key: string; name: string; price: number; limits: Record<string, number> }
  subscription: { stripeSubscriptionId: string | null; subscriptionEnd: string | null; graceEnd: string | null; plan: string; status: string } | null
  payments: any[]; subscriptionEnd: string | null; graceEnd: string | null; inGrace: boolean; isAdmin?: boolean
}

interface UsageData { totalChatbots: number; totalNodes: number; totalChats: number; plan: string; planLimit: number }

function formatInr(paise: number) {
  if (paise === 0) return "₹0"
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatUsd(cents: number) {
  if (cents === 0) return "$0"
  return "$" + (cents / 100).toFixed(2)
}

type PlanKey = "free" | "pro" | "business"

const PLAN_COLORS: Record<PlanKey, { border: string; gradient: string; accent: string; btn: string }> = {
  free: { border: "border-gray-200 ", gradient: "from-gray-50 to-white  ", accent: "bg-gray-50 ", btn: "" },
  pro: { border: "border-blue-200 ", gradient: "from-blue-50 via-white to-white   ", accent: "bg-blue-50 ", btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25" },
  business: { border: "border-purple-200 ", gradient: "from-purple-50 via-white to-white   ", accent: "bg-purple-50 ", btn: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25" },
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [razorpayLoading, setRazorpayLoading] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [changingPlan, setChangingPlan] = useState(false)

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll lose premium features when the current period ends.")) return
    setCancelling(true)
    const res = await fetch("/api/billing/cancel", { method: "POST" })
    if (res.ok) { toast.success("Subscription canceled"); window.location.reload() }
    else { const e = await res.json(); toast.error(e.error || "Failed to cancel") }
    setCancelling(false)
  }

  const handleChangePlan = async (planKey: string) => {
    setChangingPlan(true)
    const res = await fetch("/api/billing/change-plan", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planKey }) })
    if (res.ok) { toast.success(`Switched to ${planKey} plan`); window.location.reload() }
    else { const e = await res.json(); toast.error(e.error || "Failed to change plan") }
    setChangingPlan(false)
  }

  const payWithRazorpay = async (planKey: string) => {
    setRazorpayLoading(planKey)
    try {
      const res = await fetch("/api/payment/razorpay/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, currency: "inr" }),
      })
      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed to create order"); return }
      const data = await res.json()

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script")
          s.src = "https://checkout.razorpay.com/v1/checkout.js"
          s.onload = () => resolve(); s.onerror = () => reject(new Error("Failed to load Razorpay"))
          document.body.appendChild(s)
        })
      }

      const options = {
        key: data.key, amount: data.amount, currency: "INR", name: "DropBot",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan`,
        order_id: data.order_id,
        prefill: { name: data.user?.name || "", email: data.user?.email || "", contact: data.user?.phone || "" },
        handler: async function (response: any) {
          const vres = await fetch("/api/payment/razorpay/verify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planKey,
            }),
          })
          if (vres.ok) { toast.success("Payment successful! Your plan is now active."); window.location.reload() }
          else { const e = await vres.json(); toast.error(e.error || "Payment verification failed") }
        },
        modal: { ondismiss: () => setRazorpayLoading(null) },
        theme: { color: "#2563eb" },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.on("payment.failed", () => { toast.error("Payment failed"); setRazorpayLoading(null) })
      rzp.open()
    } catch (err: any) {
      toast.error(err.message || "Payment failed")
    } finally { setRazorpayLoading(null) }
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then(r => r.json()),
      fetch("/api/billing/plan").then(r => r.json()),
      fetch("/api/dashboard/stats").then(r => r.json()).catch(() => null),
    ]).then(([p, b, u]) => { setPlans(p); setBilling(b); setUsage(u) }).finally(() => setLoading(false))
  }, [])

  const currentKey = (billing?.currentPlan?.key || "free") as PlanKey
  const subEnd = billing?.subscriptionEnd
  const isExpired = subEnd && new Date(subEnd) < new Date()
  const isAdminUser = billing?.isAdmin
  const isActive = billing?.subscription?.status === "active" && currentKey !== "free"
  const colors = PLAN_COLORS[currentKey] || PLAN_COLORS.free

  const statusConfig = isAdminUser
    ? { label: "Active", variant: "success" as const, icon: Zap }
    : isActive
    ? { label: "Active", variant: "success" as const, icon: Zap }
    : billing?.inGrace
    ? { label: "Grace Period", variant: "warning" as const, icon: Clock }
    : currentKey === "free"
    ? { label: "Free", variant: "secondary" as const, icon: Sparkles }
    : { label: "Expired", variant: "destructive" as const, icon: AlertCircle }

  const StatusIcon = statusConfig.icon

  const usageBars = usage && billing?.currentPlan?.limits
    ? [
        { label: "Chatbots", used: usage.totalChatbots, limit: billing.currentPlan.limits.chatbots, icon: MessageSquare, color: "bg-blue-500" },
        { label: "Nodes", used: usage.totalNodes, limit: billing.currentPlan.limits.nodes, icon: GitBranch, color: "bg-violet-500" },
        { label: "Chats (today)", used: usage.totalChats, limit: billing.currentPlan.limits.chats, icon: Users, color: "bg-emerald-500" },
      ]
    : []

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 ">Billing</h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">Manage your plan, subscription and payment history</p>
        </div>
        {!loading && isActive && (
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling} className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all">
            {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
            Cancel Subscription
          </Button>
        )}
      </div>

        <div className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-r ${colors.gradient} p-[1px]`}>
        <div className="rounded-2xl bg-card/80 backdrop-blur-sm p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${isActive ? "bg-blue-50 " : "bg-muted"}`}>
                <div className={`absolute inset-0 rounded-2xl ${isActive ? "bg-gradient-to-br from-blue-400/20 to-purple-400/20" : ""}`} />
                {isActive ? <Zap className="h-8 w-8 text-blue-600" /> : currentKey === "free" ? <Sparkles className="h-8 w-8 text-gray-400" /> : <Clock className="h-8 w-8 text-amber-500" />}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">{billing?.currentPlan?.name || "Free"} Plan</h2>
                  <Badge variant={statusConfig.variant} className="rounded-full text-xs font-medium px-3 py-0.5">
                    <StatusIcon className="h-3 w-3 mr-1 inline" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                  {subEnd && (
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {isExpired ? "Expired" : "Renews"} {new Date(subEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                  {billing?.graceEnd && (
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <Clock className="h-3.5 w-3.5" />
                      Grace until {new Date(billing.graceEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                  {isExpired && !billing?.inGrace && currentKey !== "free" && (
                    <span className="flex items-center gap-1.5 text-red-500 font-medium">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Expired — renew to continue using premium features
                    </span>
                  )}
                </div>
              </div>
            </div>
            {isActive && (
              <Button variant="outline" size="sm" onClick={() => handleChangePlan("free")} disabled={changingPlan} className="gap-2 shrink-0 border-gray-300 hover:bg-gray-50 transition-all">
                {changingPlan ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                Downgrade Plan
              </Button>
            )}
          </div>

          {usageBars.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {usageBars.map((item) => {
                const limit = item.limit === -1 ? Infinity : item.limit
                const pct = limit === Infinity ? 0 : Math.min(100, Math.round((item.used / limit) * 100))
                return (
                  <div key={item.label} className="rounded-xl bg-card border border-gray-100  p-4 hover:border-gray-200  transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <span className="text-sm tabular-nums">
                        <span className="font-semibold text-gray-900">{item.used}</span>
                        {limit !== Infinity && <span className="text-gray-400"> / {limit}</span>}
                      </span>
                    </div>
                    {limit !== Infinity && (
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : item.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900">Plans &amp; Pricing</h2>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100  bg-card p-8 space-y-6">
                <div className="space-y-3">
                  <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                  <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, j) => <div key={j} className="h-4 w-full bg-muted rounded animate-pulse" />)}
                </div>
                <div className="h-12 w-full bg-muted rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = currentKey === plan.key
              const pk = plan.key as PlanKey
              const pc = PLAN_COLORS[pk] || PLAN_COLORS.free
              let features: string[] = []
              try { features = JSON.parse(plan.features) } catch { features = [] }

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border bg-card transition-all duration-300 ${
                    isCurrent
                      ? `${pc.border} ring-2 ring-blue-500/20 shadow-lg`
                      : `${pc.border} hover:-translate-y-1 hover:shadow-xl`
                  } ${plan.popular && !isCurrent ? "border-blue-300 shadow-md" : ""}`}
                >
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-blue-500/25 whitespace-nowrap">
                        <Sparkles className="h-3 w-3 inline -mt-0.5 mr-1" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                      Current
                    </div>
                  )}

                  <div className="p-8 flex flex-col flex-1">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-4">
                    {billing?.isAdmin ? (
                      <Button className="w-full h-12 rounded-xl" variant="outline" disabled>
                        {isCurrent ? "Current Plan" : "Admin Only"}
                      </Button>
                    ) : plan.priceInr > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-5xl font-extrabold tracking-tight text-gray-900">
                                {formatInr(plan.priceInr)}
                              </span>
                              <span className="text-base text-gray-400 font-medium">/mo</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-400">
                              <IndianRupee className="h-3.5 w-3.5" />
                              <span className="line-through">{formatUsd(plan.price)} USD</span>
                              <span className="text-[10px] bg-green-50 text-green-600 font-semibold px-1.5 py-0.5 rounded">INR</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-5xl font-extrabold tracking-tight text-gray-900">Free</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3.5 mb-8">
                      {features.map((f, idx) => (
                        <div key={idx} className="flex items-start gap-3 group">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 mt-0.5 group-hover:bg-blue-100 transition-colors">
                            <Check className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{f}</span>
                        </div>
                      ))}
                    </div>

                    {billing?.isAdmin ? (
                      <Button className="w-full h-12 rounded-xl" variant="outline" disabled>
                        {isCurrent ? "Current Plan" : "Admin Only"}
                      </Button>
                    ) : plan.priceInr > 0 ? (
                      <Button
                        className={`w-full h-12 rounded-xl font-semibold text-sm transition-all ${
                          isCurrent
                            ? "border-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                            : pc.btn
                        }`}
                        variant={isCurrent ? "outline" : "default"}
                        onClick={() => payWithRazorpay(plan.key)}
                        disabled={razorpayLoading === plan.key}
                      >
                        {razorpayLoading === plan.key ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        {isCurrent ? "Renew Plan" : "Subscribe Now"}
                      </Button>
                    ) : (
                      <Button className="w-full h-12 rounded-xl" variant="outline" disabled>
                        {isCurrent ? "Current Plan" : "Free"}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            Secured by <span className="font-medium text-gray-500">Razorpay</span>
          </span>
          <span className="flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4" />
            All prices in INR
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Cancel anytime
          </span>
        </div>
      </div>

      {billing?.payments && billing.payments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
          </div>

          <div className="rounded-2xl border border-gray-100  bg-card overflow-hidden">
            {billing.payments.map((p: any, idx: number) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-card-hover ${
                  idx !== billing.payments.length - 1 ? "border-b border-gray-100 " : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    p.status === "completed" ? "bg-green-50 " : "bg-muted"
                  }`}>
                    {p.currency === "inr"
                      ? <IndianRupee className={`h-5 w-5 ${p.status === "completed" ? "text-green-600" : "text-gray-400"}`} />
                      : <DollarSign className={`h-5 w-5 ${p.status === "completed" ? "text-green-600" : "text-gray-400"}`} />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {p.currency === "inr" ? formatInr(p.amount) : formatUsd(p.amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      &nbsp;&middot;&nbsp;{p.method || "razorpay"}
                      {p.planKey && <>&nbsp;&middot;&nbsp;{p.planKey} plan</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={p.status === "completed" ? "success" : "secondary"} className="rounded-full text-[11px] px-2.5 py-0.5 font-medium">
                    {p.status}
                  </Badge>
                  {p.status === "completed" && (
                    <button
                      onClick={() => window.open(`/api/billing/receipt/${p.id}`)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Receipt</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (!billing?.payments || billing.payments.length === 0) && billing?.currentPlan?.key !== "free" && (
        <div className="rounded-2xl border border-dashed border-gray-200  bg-muted/50 p-8 text-center">
          <Receipt className="h-10 w-10 text-gray-300  mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 ">No payment history yet</p>
          <p className="text-xs text-gray-400  mt-1">Payments will appear here after your first subscription</p>
        </div>
      )}
    </div>
  )
}

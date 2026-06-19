"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Clock, AlertCircle, IndianRupee, DollarSign, Zap, FileText, X, Ban, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"

interface Plan {
  id: string; key: string; name: string; price: number; priceInr: number; priceId: string | null; features: string; popular: boolean
}

interface BillingData {
  currentPlan: { key: string; name: string; price: number; limits: Record<string, number> }
  subscription: { stripeSubscriptionId: string | null; subscriptionEnd: string | null; graceEnd: string | null; plan: string; status: string } | null
  payments: any[]
  plans: Plan[]
  subscriptionEnd: string | null
  graceEnd: string | null
  inGrace: boolean
}

function formatInr(paise: number) {
  if (paise === 0) return "₹0"
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatUsd(cents: number) {
  if (cents === 0) return "$0"
  return "$" + (cents / 100).toFixed(2)
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billing, setBilling] = useState<BillingData | null>(null)
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
      const { order_id, amount, key } = data

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script")
          s.src = "https://checkout.razorpay.com/v1/checkout.js"
          s.onload = () => resolve()
          s.onerror = () => reject(new Error("Failed to load Razorpay"))
          document.body.appendChild(s)
        })
      }

      const options = {
        key, amount, currency: "INR", name: "DropBot",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan`,
        order_id,
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
    } finally {
      setRazorpayLoading(null)
    }
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/billing/plan").then((r) => r.json()),
    ]).then(([p, b]) => { setPlans(p); setBilling(b) }).finally(() => setLoading(false))
  }, [])

  const currentKey = billing?.currentPlan?.key || "free"
  const subEnd = billing?.subscriptionEnd
  const isExpired = subEnd && new Date(subEnd) < new Date()
  const isActive = billing?.subscription?.status === "active" && currentKey !== "free"

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your subscription and payments</p>
        </div>
        {!loading && isActive && (
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
            {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
            Cancel
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
              {isActive ? <Zap className="h-7 w-7 text-blue-600" /> : <Clock className="h-7 w-7 text-gray-400" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-gray-900">{billing?.currentPlan?.name || "Free"} Plan</p>
                <Badge variant={currentKey === "free" ? "secondary" : "success"} className="rounded-full">
                  {isActive ? "Active" : billing?.inGrace ? "Grace Period" : currentKey === "free" ? "Free" : "Expired"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                {subEnd && !isExpired && (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Valid until {new Date(subEnd).toLocaleDateString()}</span>
                )}
                {billing?.graceEnd && !isExpired && (
                  <span className="flex items-center gap-1 text-amber-600"><Clock className="h-3.5 w-3.5" /> Grace until {new Date(billing.graceEnd).toLocaleDateString()}</span>
                )}
                {isExpired && billing?.inGrace && (
                  <span className="flex items-center gap-1 text-amber-600"><AlertCircle className="h-3.5 w-3.5" /> Grace until {billing.graceEnd ? new Date(billing.graceEnd).toLocaleDateString() : "N/A"}</span>
                )}
                {isExpired && !billing?.inGrace && currentKey !== "free" && (
                  <span className="flex items-center gap-1 text-red-500"><AlertCircle className="h-3.5 w-3.5" /> Expired — renew to continue</span>
                )}
              </div>
            </div>
          </div>
          {isActive && (
            <Button variant="outline" size="sm" onClick={() => handleChangePlan("free")} disabled={changingPlan} className="gap-1.5 shrink-0">
              {changingPlan ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Downgrade
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
              <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-9 w-36 bg-gray-100 rounded animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-4 w-full bg-gray-100 rounded animate-pulse" />)}
              </div>
              <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentKey === plan.key
            let features: string[] = []
            try { features = JSON.parse(plan.features) } catch { features = [] }
            return (
              <div key={plan.id} className={`relative flex flex-col rounded-xl border bg-white p-6 transition-shadow hover:shadow-md ${isCurrent ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200"} ${plan.popular && !isCurrent ? "border-blue-300" : ""}`}>
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">Most Popular</div>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-3">
                    {plan.price > 0 ? (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-gray-900">{formatUsd(plan.price)}</span>
                          <span className="text-sm text-gray-400">/month</span>
                        </div>
                        {plan.priceInr > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                            <IndianRupee className="h-3.5 w-3.5" />
                            <span className="font-medium">{formatInr(plan.priceInr)}</span>
                            <span className="text-gray-400">/month</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-4xl font-bold text-gray-900">Free</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-3 mb-6">
                  {features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
                {plan.price > 0 && plan.priceInr > 0 ? (
                  <Button
                    className="w-full gap-2 h-11"
                    variant={isCurrent ? "outline" : "default"}
                    onClick={() => payWithRazorpay(plan.key)}
                    disabled={razorpayLoading === plan.key}
                  >
                    {razorpayLoading === plan.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {isCurrent ? "Resubscribe" : "Subscribe"} with Razorpay
                  </Button>
                ) : (
                  <Button className="w-full h-11" variant="outline" disabled>
                    {isCurrent ? "Current Plan" : "Free"}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && plans.some(p => p.priceInr > 0) && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          Secure payments powered by <span className="font-medium text-gray-500">Razorpay</span>
        </div>
      )}

      {billing?.payments && billing.payments.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Payment History</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {billing.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                    {p.currency === "inr" ? <IndianRupee className="h-4 w-4 text-gray-500" /> : <DollarSign className="h-4 w-4 text-gray-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.currency === "inr" ? formatInr(p.amount) : formatUsd(p.amount)}</p>
                    <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()} &middot; {p.method || "razorpay"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.status === "completed" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                    {p.status}
                  </span>
                  {p.status === "completed" && (
                    <button onClick={() => window.open(`/api/billing/receipt/${p.id}`)} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

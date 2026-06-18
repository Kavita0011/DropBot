"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Clock, AlertCircle, IndianRupee, DollarSign, Zap, FileText, X, Ban } from "lucide-react"
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
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose premium features when the current period (including grace period) ends.")) return
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
        key,
        amount,
        currency: "INR",
        name: "DropBot",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan`,
        order_id,
        prefill: {
          name: data.user?.name || "",
          email: data.user?.email || "",
          contact: data.user?.phone || "",
        },
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
          if (vres.ok) {
            toast.success("Payment successful! Your plan is now active.")
            const data = await vres.json()
            window.location.reload()
          } else {
            const e = await vres.json()
            toast.error(e.error || "Payment verification failed")
          }
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription. Prices in USD ($) or INR (₹).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>You are on the {billing?.currentPlan?.name || "Free"} plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={currentKey === "free" ? "secondary" : "success"}>{billing?.currentPlan?.name || "Free"}</Badge>
            {billing?.subscription?.status === "active" && <Badge variant="success">Active</Badge>}
            {billing?.inGrace && <Badge variant="warning" className="text-[10px]">Grace Period</Badge>}
          </div>
          {subEnd && !isExpired && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Plan valid until {new Date(subEnd).toLocaleDateString()}
            </p>
          )}
          {billing?.graceEnd && !isExpired && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Grace period ends {new Date(billing.graceEnd).toLocaleDateString()}
            </p>
          )}
          {isExpired && billing?.inGrace && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Subscription expired. Grace period until {billing.graceEnd ? new Date(billing.graceEnd).toLocaleDateString() : "N/A"}. Renew to avoid downgrade.
            </p>
          )}
          {isExpired && !billing?.inGrace && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Plan expired. Please renew to continue using premium features.
            </p>
          )}
          {billing?.subscription?.status === "active" && currentKey !== "free" && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
                {cancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                Cancel Subscription
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleChangePlan("free")} disabled={changingPlan} className="gap-1">
                {changingPlan ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                Downgrade to Free
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-4 w-full bg-gray-100 rounded animate-pulse" />)}
              </CardContent>
              <CardContent>
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : plans.map((plan) => {
          const isCurrent = currentKey === plan.key
          let features: string[] = []
          try { features = JSON.parse(plan.features) } catch { features = [] }
          return (
            <Card key={plan.id} className={`flex flex-col relative ${isCurrent ? "border-blue-500 ring-1 ring-blue-500" : ""} ${plan.popular && !isCurrent ? "border-blue-300" : ""}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">Most Popular</div>}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-2 space-y-1">
                  {plan.price > 0 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-3xl font-bold">{formatUsd(plan.price)}</span>
                        <span className="text-sm text-gray-500">/month</span>
                      </div>
                      {plan.priceInr > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <IndianRupee className="h-3.5 w-3.5" />
                          <span className="font-semibold text-gray-700">{formatInr(plan.priceInr)}</span>
                          <span className="text-gray-400">/month</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-3xl font-bold">Free</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardContent className="space-y-2">
                {plan.price === 0 && !isCurrent ? null : isCurrent ? (
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                    {plan.priceInr > 0 && (
                      <Button className="w-full gap-2" onClick={() => payWithRazorpay(plan.key)} disabled={razorpayLoading === plan.key} variant="outline">
                        {razorpayLoading === plan.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Pay with Razorpay (₹)
                      </Button>
                    )}
                  </div>
                ) : plan.priceInr > 0 ? (
                  <Button className="w-full gap-2" onClick={() => payWithRazorpay(plan.key)} disabled={razorpayLoading === plan.key}>
                    {razorpayLoading === plan.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Subscribe with Razorpay
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {billing?.payments && billing.payments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {billing.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{p.currency === "inr" ? formatInr(p.amount) : formatUsd(p.amount)}</span>
                  <span className="text-xs text-gray-400 uppercase">{p.currency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === "completed" ? "success" : "secondary"} className="text-[10px]">{p.status}</Badge>
                  <span className="text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
                  {p.status === "completed" && (
                    <button onClick={() => window.open(`/api/billing/receipt/${p.id}`)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
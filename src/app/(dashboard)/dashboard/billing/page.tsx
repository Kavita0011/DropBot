"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard, ExternalLink, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface Plan {
  id: string; key: string; name: string; price: number; priceId: string | null; features: string; popular: boolean
}

interface BillingData {
  currentPlan: { key: string; name: string; price: number; limits: Record<string, number> }
  subscription: any
  payments: any[]
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/billing/plan").then((r) => r.json()),
    ]).then(([p, b]) => { setPlans(p); setBilling(b) }).finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async (priceId: string) => {
    setUpgrading(priceId)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error("Failed to create checkout")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setUpgrading(null)
    }
  }

  const handlePortal = async () => {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      toast.error("Failed to open billing portal")
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  const currentKey = billing?.currentPlan?.key || "free"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>You are on the {billing?.currentPlan?.name || "Free"} plan.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Badge variant={currentKey === "free" ? "secondary" : "success"}>{billing?.currentPlan?.name || "Free"}</Badge>
          {billing?.subscription?.stripeSubscriptionId && (
            <Button variant="outline" size="sm" onClick={handlePortal} className="gap-2">
              <CreditCard className="h-4 w-4" /> Manage Billing <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentKey === plan.key
          const features = JSON.parse(plan.features) as string[]
          return (
            <Card key={plan.id} className={`flex flex-col relative ${isCurrent ? "border-blue-500 ring-1 ring-blue-500" : ""} ${plan.popular && !isCurrent ? "border-blue-300" : ""}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">Most Popular</div>}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price === 0 ? "$0" : `$${plan.price / 100}`}</span>
                  {plan.price > 0 && <span className="text-sm text-gray-500">/month</span>}
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
              <CardContent>
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={isCurrent || !plan.priceId}
                  onClick={() => plan.priceId && handleUpgrade(plan.priceId)}
                >
                  {isCurrent ? "Current Plan" : upgrading === plan.priceId ? "Loading..." : plan.priceId ? "Upgrade" : "Contact Sales"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {billing?.payments && billing.payments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {billing.payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">${(p.amount / 100).toFixed(2)}</span>
                    <span className="ml-2 text-gray-500 capitalize">{p.currency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "completed" ? "success" : "secondary"}>{p.status}</Badge>
                    <span className="text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

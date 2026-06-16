"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard, ExternalLink, Loader2, Smartphone, Landmark, Copy } from "lucide-react"
import toast from "react-hot-toast"

interface Plan {
  id: string; key: string; name: string; price: number; priceId: string | null; features: string; popular: boolean
}

interface BillingData {
  currentPlan: { key: string; name: string; price: number; limits: Record<string, number> }
  subscription: any
  payments: any[]
}

interface PaymentSettings {
  upiId: string | null
  bankDisplayName: string | null
  bankAccountNumber: string | null
  bankIfsc: string | null
  bankAccountHolder: string | null
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [paySettings, setPaySettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/billing/plan").then((r) => r.json()),
      fetch("/api/payment-settings").then((r) => r.json()),
    ]).then(([p, b, s]) => { setPlans(p); setBilling(b); setPaySettings(s) }).finally(() => setLoading(false))
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`)).catch(() => toast.error("Failed to copy"))
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  const currentKey = billing?.currentPlan?.key || "free"
  const hasManualPayment = paySettings?.upiId || (paySettings?.bankAccountNumber && paySettings?.bankIfsc)

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
          let features: string[] = []
          try { features = JSON.parse(plan.features) } catch { features = [] }
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

      {hasManualPayment && (
        <Card>
          <CardHeader>
            <CardTitle>Pay via Bank Transfer / UPI</CardTitle>
            <CardDescription>Send payment and email us at devappkavita@gmail.com with the transaction ID to activate your subscription.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              {paySettings?.upiId && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">UPI</h3>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-purple-100">
                    <span className="text-sm font-mono text-gray-800">{paySettings.upiId}</span>
                    <button onClick={() => copyToClipboard(paySettings.upiId!, "UPI ID")} className="text-purple-600 hover:text-purple-800">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              {paySettings?.bankAccountNumber && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Bank Transfer</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    {paySettings.bankAccountHolder && (
                      <div className="flex justify-between"><span className="text-gray-500">Account Holder</span><span className="font-medium">{paySettings.bankAccountHolder}</span></div>
                    )}
                    {paySettings.bankDisplayName && (
                      <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{paySettings.bankDisplayName}</span></div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Account Number</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium font-mono">{paySettings.bankAccountNumber}</span>
                        <button onClick={() => copyToClipboard(paySettings.bankAccountNumber!, "Account number")} className="text-blue-600 hover:text-blue-800">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {paySettings.bankIfsc && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">IFSC</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium font-mono">{paySettings.bankIfsc}</span>
                          <button onClick={() => copyToClipboard(paySettings.bankIfsc!, "IFSC")} className="text-blue-600 hover:text-blue-800">
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

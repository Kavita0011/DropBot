"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard, ExternalLink, Loader2, Smartphone, Landmark, Copy, QrCode, Banknote, ChevronRight, Clock } from "lucide-react"
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
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white pb-6">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-gray-700" />
              <CardTitle>Offline Payment</CardTitle>
            </div>
            <CardDescription className="mt-1.5 text-sm">
              Choose a payment method and send the exact amount. After payment, email the transaction ID to <span className="font-medium text-gray-700">devappkavita@gmail.com</span> and your plan will be activated within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-8 lg:grid-cols-2">
              {paySettings?.upiId && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                      <Smartphone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Pay via UPI</h3>
                      <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 py-3">
                    <img
                      src={`https://chart.googleapis.com/chart?chs=180x180&cht=qr&chl=upi://pay?pa=${encodeURIComponent(paySettings.upiId)}&pn=DropBot&cu=INR`}
                      alt="UPI QR Code"
                      className="rounded-xl border border-gray-100 shadow-sm"
                      width={180}
                      height={180}
                    />
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 w-full">
                      <span className="flex-1 text-sm font-mono text-gray-600 truncate">{paySettings.upiId}</span>
                      <button
                        onClick={() => copyToClipboard(paySettings.upiId!, "UPI ID")}
                        className="flex items-center gap-1.5 rounded-md bg-white border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-green-50 border border-green-100 px-4 py-3">
                    <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wider">How to Pay</h4>
                    <ol className="mt-2 space-y-1.5 text-xs text-green-700">
                      <li className="flex items-start gap-2">1. Open any UPI app (GPay / PhonePe / Paytm)</li>
                      <li className="flex items-start gap-2">2. Scan the QR code or enter UPI ID above</li>
                      <li className="flex items-start gap-2">3. Enter the plan amount and complete payment</li>
                      <li className="flex items-start gap-2">4. Email transaction ID to devappkavita@gmail.com</li>
                    </ol>
                  </div>
                </div>
              )}

              {paySettings?.bankAccountNumber && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                      <Landmark className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Bank Transfer</h3>
                      <p className="text-xs text-gray-500">NEFT / IMPS / RTGS</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Account Holder", value: paySettings.bankAccountHolder, copy: paySettings.bankAccountHolder },
                      { label: "Bank Name", value: paySettings.bankDisplayName, copy: paySettings.bankDisplayName },
                      { label: "Account Number", value: paySettings.bankAccountNumber, copy: paySettings.bankAccountNumber },
                      { label: "IFSC Code", value: paySettings.bankIfsc, copy: paySettings.bankIfsc },
                    ].map((item) => item.value ? (
                      <div key={item.label} className="flex items-center justify-between rounded-lg bg-gray-50 px-3.5 py-2.5 border border-gray-100">
                        <div>
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(item.copy!, item.label)}
                          className="shrink-0 rounded-md border border-gray-200 bg-white p-1.5 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                          title={`Copy ${item.label}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null)}
                  </div>

                  <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                    <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Instructions</h4>
                    <ol className="mt-2 space-y-1.5 text-xs text-blue-700">
                      <li className="flex items-start gap-2">1. Transfer the exact plan amount to the account above</li>
                      <li className="flex items-start gap-2">2. Use NEFT / IMPS / RTGS from your bank app</li>
                      <li className="flex items-start gap-2">3. Add your email ID as transaction reference</li>
                      <li className="flex items-start gap-2">4. Email the UTR/transaction ID to devappkavita@gmail.com</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-4">
              <Clock className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">After payment:</span> Send your transaction ID to <span className="font-semibold text-gray-700">devappkavita@gmail.com</span>.
                Your plan will be upgraded within 24 hours on business days.
              </div>
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

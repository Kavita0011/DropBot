"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const plans = [
  { name: "Free", price: "$0", features: ["1 chatbot", "10 nodes", "100 chats/month"], current: true },
  { name: "Pro", price: "$29", features: ["5 chatbots", "50 nodes", "5,000 chats/month", "AI responses"], current: false },
  { name: "Business", price: "$99", features: ["Unlimited chatbots", "Unlimited nodes", "Unlimited chats", "Custom branding"], current: false },
]

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription and billing.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Current Plan</CardTitle><CardDescription>You are on the Free plan.</CardDescription></CardHeader>
        <CardContent><Badge variant="secondary">Free</Badge></CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex flex-col ${plan.current ? "border-blue-500 ring-1 ring-blue-500" : ""}`}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-2"><span className="text-3xl font-bold">{plan.price}</span>{plan.price !== "$0" && <span className="text-sm text-gray-500">/month</span>}</div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">{plan.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="h-4 w-4 text-blue-600 flex-shrink-0" />{f}</li>)}</ul>
            </CardContent>
            <CardContent>
              <Button className="w-full" variant={plan.current ? "outline" : "default"} disabled={plan.current}>
                {plan.current ? "Current Plan" : "Upgrade"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

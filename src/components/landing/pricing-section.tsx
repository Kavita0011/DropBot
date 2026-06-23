"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Plan {
  id: string; name: string; price: number; features: string; popular: boolean
}

export function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(setPlans)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <section className="py-24 text-center text-gray-400"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></section>

  return (
    <section className="border-t border-gray-100 py-24" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Simple pricing</h2>
          <p className="mt-4 text-lg text-gray-500">Start free, scale as you grow.</p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3 items-start">
          {plans.map((plan) => {
            let features: string[] = []
            try { features = JSON.parse(plan.features) } catch {}
            return (
              <Card key={plan.id} className={cn("relative flex flex-col", plan.popular && "border-blue-500 ring-1 ring-blue-500 shadow-lg scale-105")}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">Most Popular</div>}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">${plan.price === 0 ? "0" : (plan.price / 100).toFixed(0)}</span>
                    {plan.price > 0 && <span className="text-sm text-gray-500 ml-1">/month</span>}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardContent>
                  <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                    <Link href="/register">Get Started Free</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

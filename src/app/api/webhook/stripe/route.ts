import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { PLANS, type PlanKey } from "@/lib/stripe"

async function getPlanKeyFromPriceId(priceId: string): Promise<PlanKey | null> {
  for (const [key, plan] of Object.entries(PLANS)) {
    if ("priceId" in plan && plan.priceId === priceId) return key as PlanKey
  }
  return null
}

async function upsertSubscription(userId: string, data: {
  stripeSubscriptionId?: string
  stripePriceId?: string
  status?: string
  currentPeriodEnd?: Date
  plan?: string
}) {
  const existing = await prisma.subscription.findFirst({ where: { userId } })
  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data })
  } else {
    await prisma.subscription.create({
      data: { id: `${userId}_sub`, userId, ...data },
    })
  }
}

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get("stripe-signature")
  if (!signature) return NextResponse.json({ error: "No signature" }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const getUserId = async (customerId: string) => {
    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
    return user?.id
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const userId = await getUserId(session.customer)
    if (userId) {
      await prisma.payment.create({
        data: {
          userId,
          amount: session.amount_total,
          stripePaymentId: session.id,
          status: "completed",
        },
      })
      const planKey = await getPlanKeyFromPriceId(session.metadata?.priceId || session.line_items?.data?.[0]?.price?.id || "")
      if (planKey) {
        await upsertSubscription(userId, { plan: planKey, status: "active", stripeSubscriptionId: session.subscription as string, stripePriceId: session.metadata?.priceId })
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const sub = event.data.object as any
    const userId = await getUserId(sub.customer)
    if (userId) {
      const planKey = sub.items?.data?.[0]?.price?.id ? await getPlanKeyFromPriceId(sub.items.data[0].price.id) : null
      await upsertSubscription(userId, { stripeSubscriptionId: sub.id, status: sub.status, currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined, plan: planKey || "free" })
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as any
    const userId = await getUserId(sub.customer)
    if (userId) {
      await upsertSubscription(userId, { status: "canceled", currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined })
    }
  }

  return NextResponse.json({ received: true })
}

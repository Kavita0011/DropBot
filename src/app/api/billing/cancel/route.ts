import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sub = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: "active" },
    orderBy: { createdAt: "desc" },
  })
  if (!sub) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 })
  }

  if (sub.stripeSubscriptionId && stripe) {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "canceled", subscriptionEnd: sub.subscriptionEnd || new Date() },
  })

  return NextResponse.json({ success: true, message: "Subscription canceled. Access ends on " + (sub.subscriptionEnd ? new Date(sub.subscriptionEnd).toLocaleDateString() : "now") })
}
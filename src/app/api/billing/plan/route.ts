import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PLANS } from "@/lib/stripe"

const GRACE_DAYS = 5

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()
  if (subscription && subscription.subscriptionEnd && new Date(subscription.subscriptionEnd) < now) {
    if (subscription.graceEnd && new Date(subscription.graceEnd) > now) {
      // In grace period — keep premium but mark as grace
    } else {
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { plan: "free", status: "inactive", subscriptionEnd: null, graceEnd: null },
      })
    }
  }

  const [payments, plans] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.plan.findMany({ where: { active: true }, orderBy: { price: "asc" } }),
  ])

  const inGrace = subscription?.subscriptionEnd && new Date(subscription.subscriptionEnd) < now && subscription?.graceEnd && new Date(subscription.graceEnd) > now
  const effectiveStatus = inGrace ? "active" : subscription?.status
  const planKey = (effectiveStatus === "active" ? subscription?.plan : "free") as keyof typeof PLANS
  const plan = PLANS[planKey] || PLANS.free

  return NextResponse.json({
    subscription: subscription || null,
    payments,
    currentPlan: {
      key: planKey,
      name: plan.name,
      price: plan.price,
      limits: {
        chatbots: plan.chatbots,
        nodes: plan.nodes,
        chats: plan.chats,
      },
    },
    plans,
    subscriptionEnd: subscription?.subscriptionEnd || null,
    graceEnd: subscription?.graceEnd || null,
    inGrace: inGrace || false,
  })
}

export async function POST() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const expired = await prisma.subscription.findMany({
    where: {
      status: "active",
      subscriptionEnd: { not: null, lt: new Date() },
    },
  })

  for (const sub of expired) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { plan: "free", status: "inactive", subscriptionEnd: null },
    })
  }

  return NextResponse.json({ downgraded: expired.length })
}
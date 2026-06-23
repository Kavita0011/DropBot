import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const GRACE_DAYS = 5

const ADMIN_PLAN = {
  key: "business",
  name: "Business",
  price: 0,
  limits: { chatbots: -1, nodes: -1, chats: -1 },
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin = (session?.user as { role?: string })?.role === "admin"

  if (isAdmin) {
    const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { price: "asc" } })
    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    return NextResponse.json({
      subscription: null,
      payments,
      currentPlan: ADMIN_PLAN,
      plans,
      subscriptionEnd: null,
      graceEnd: null,
      inGrace: false,
      isAdmin: true,
    })
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
  const plan = await prisma.plan.findUnique({ where: { key: (effectiveStatus === "active" ? subscription?.plan : "free") || "free" } })
  const planKey = plan?.key || "free"

  return NextResponse.json({
    subscription: subscription || null,
    payments,
    currentPlan: {
      key: planKey,
      name: plan?.name || "Free",
      price: plan?.price || 0,
      limits: { chatbots: plan?.chatbots || 1, nodes: plan?.nodes || 10, chats: plan?.chats || 100 },
    },
    plans,
    subscriptionEnd: subscription?.subscriptionEnd || null,
    graceEnd: subscription?.graceEnd || null,
    inGrace: inGrace || false,
    isAdmin: false,
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
      user: { role: { not: "admin" } },
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
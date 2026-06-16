import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PLANS } from "@/lib/stripe"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [subscription, payments] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const planKey = (subscription?.status === "active" ? subscription.plan : "free") as keyof typeof PLANS
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
  })
}

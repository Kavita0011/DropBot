import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentPlan, getUsage } from "@/lib/plans"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const usage = await getUsage(session.user.id)
  const plan = await getCurrentPlan(session.user.id)

  const allChatSessions = await prisma.chatSession.count({
    where: { userId: session.user.id },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayChats = await prisma.chatSession.count({
    where: { userId: session.user.id, createdAt: { gte: today } },
  })

  return NextResponse.json({
    totalChatbots: usage.chatbotCount,
    totalNodes: usage.nodeCount,
    totalChats: allChatSessions,
    todayChats,
    plan: plan.plan,
    planLimit: plan.limits.chatbots,
  })
}

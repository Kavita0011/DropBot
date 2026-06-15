import { prisma } from "./prisma"
import { PLANS, type PlanKey } from "./stripe"

export async function getPlanLimits(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  const plan = (subscription?.plan as PlanKey) || "free"
  return PLANS[plan]
}

export async function getUsage(userId: string) {
  const chatbotCount = await prisma.chatbot.count({ where: { userId } })
  const chatbots = await prisma.chatbot.findMany({ where: { userId }, select: { id: true, flowData: true } })
  let nodeCount = 0
  for (const bot of chatbots) {
    try {
      const flow = JSON.parse(bot.flowData)
      nodeCount += (flow.nodes || []).length
    } catch { nodeCount += 0 }
  }

  return { chatbotCount, nodeCount }
}

export async function checkChatbotLimit(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const limits = await getPlanLimits(userId)
  if (limits.chatbots === -1) return { allowed: true }

  const { chatbotCount } = await getUsage(userId)
  if (chatbotCount >= limits.chatbots) {
    return { allowed: false, error: `Plan limit reached (${limits.chatbots} chatbots). Upgrade to create more.` }
  }

  return { allowed: true }
}

export async function checkNodeLimit(userId: string, newNodes: number): Promise<{ allowed: boolean; error?: string }> {
  const limits = await getPlanLimits(userId)
  if (limits.nodes === -1) return { allowed: true }

  const { nodeCount } = await getUsage(userId)
  if (nodeCount + newNodes > limits.nodes) {
    return { allowed: false, error: `Node limit would be exceeded (max ${limits.nodes}). Upgrade for more.` }
  }

  return { allowed: true }
}

export async function checkChatLimit(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const limits = await getPlanLimits(userId)
  if (limits.chats === -1) return { allowed: true }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const chatCount = await prisma.chatSession.count({
    where: { userId, createdAt: { gte: today } },
  })

  if (chatCount >= limits.chats) {
    return { allowed: false, error: `Daily chat limit reached (${limits.chats}). Upgrade for more.` }
  }

  return { allowed: true }
}

export async function getCurrentPlan(userId: string): Promise<{ plan: string; limits: { chatbots: number; nodes: number; chats: number } }> {
  const limits = await getPlanLimits(userId)
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  return { plan: subscription?.plan || "free", limits }
}

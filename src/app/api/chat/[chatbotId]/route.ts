import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateChatReply } from "@/lib/ai"
import { checkChatLimit } from "@/lib/plans"

export async function POST(req: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const { chatbotId } = await params
    const { message, history = [] } = await req.json()

    const chatbot = await prisma.chatbot.findFirst({
      where: { id: chatbotId, published: true },
    })

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 })
    }

    const userId = chatbot.userId
    const limitCheck = await checkChatLimit(userId)
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error }, { status: 429 })
    }

    const flowData = JSON.parse(chatbot.flowData)

    const reply = await generateChatReply(chatbotId, message, history, flowData)

    await prisma.chatSession.upsert({
      where: { id: `${chatbotId}_${new Date().toISOString().split("T")[0]}` },
      update: { messages: { increment: 1 } },
      create: {
        id: `${chatbotId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        chatbotId,
        userId,
        messages: 1,
      },
    })

    return NextResponse.json({
      reply: reply.reply,
      nodeId: reply.nodeId,
    })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

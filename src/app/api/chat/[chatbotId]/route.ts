import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateChatReply } from "@/lib/ai"
import { checkChatLimit } from "@/lib/plans"

export async function POST(req: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const { chatbotId } = await params
    const { message, history = [] } = await req.json()

    const chatbot = await prisma.chatbot.findFirst({
      where: { id: chatbotId, status: "approved" },
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

    const dateStr = new Date().toISOString().split("T")[0]
    let session = await prisma.chatSession.findFirst({
      where: { chatbotId, createdAt: { gte: new Date(dateStr) }, userId },
    })

    if (!session) {
      session = await prisma.chatSession.create({
        data: { chatbotId, userId: userId },
      })
    }

    await prisma.message.createMany({
      data: [
        { sessionId: session.id, role: "user", content: message },
        { sessionId: session.id, role: "bot", content: reply.reply },
      ],
    })

    return NextResponse.json({ reply: reply.reply, nodeId: reply.nodeId })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

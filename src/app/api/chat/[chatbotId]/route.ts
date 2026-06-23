import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateChatReply } from "@/lib/ai"
import { checkChatLimit } from "@/lib/plans"

export async function POST(req: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const { chatbotId } = await params
    const { message, history = [], visitorId: rawVisitorId } = await req.json()

    if (!message || typeof message !== "string" || message.length > 2000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    }

    const visitorId = rawVisitorId || crypto.randomUUID()

    const chatbot = await prisma.chatbot.findFirst({
      where: { id: chatbotId, status: "approved" },
    })

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 })
    }

    const ownerId = chatbot.userId
    const limitCheck = await checkChatLimit(ownerId)
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error }, { status: 429 })
    }

    const flowData = JSON.parse(chatbot.flowData)
    const reply = await generateChatReply(chatbotId, message, history, flowData)

    const dateStr = new Date().toISOString().split("T")[0]
    const sessionId = `session-${chatbotId}-${dateStr}-${visitorId}`

    let session = await prisma.chatSession.upsert({
      where: { id: sessionId },
      update: {},
      create: { id: sessionId, chatbotId, userId: ownerId },
    })

    await prisma.message.createMany({
      data: [
        { sessionId: session.id, role: "user", content: message },
        { sessionId: session.id, role: "bot", content: reply.reply },
      ],
    })

    return NextResponse.json({ reply: reply.reply, nodeId: reply.nodeId, visitorId })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

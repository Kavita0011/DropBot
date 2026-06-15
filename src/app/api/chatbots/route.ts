import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkChatbotLimit } from "@/lib/plans"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const chatbots = await prisma.chatbot.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(chatbots)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limitCheck = await checkChatbotLimit(session.user.id)
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.error }, { status: 403 })
  }

  const { name, description } = await req.json()

  const chatbot = await prisma.chatbot.create({
    data: {
      userId: session.user.id,
      name: name || "My Chatbot",
      description: description || "",
      flowData: JSON.stringify({
        nodes: [
          {
            id: "welcome",
            type: "welcome",
            position: { x: 300, y: 50 },
            data: { message: "Hello! How can I help you today?" },
          },
        ],
        edges: [],
      }),
    },
  })

  return NextResponse.json(chatbot, { status: 201 })
}

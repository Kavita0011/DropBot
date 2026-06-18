import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: chatbotId } = await params

  const chatbot = await prisma.chatbot.findFirst({
    where: { id: chatbotId, userId: session.user.id },
  })
  if (!chatbot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const url = new URL(req.url)
  const exportAll = url.searchParams.get("all") === "true"

  const [totalSessions, todaySessions, totalMessages, recentSessions, allSessions] = await Promise.all([
    prisma.chatSession.count({ where: { chatbotId } }),
    prisma.chatSession.count({
      where: { chatbotId, createdAt: { gte: new Date(new Date().toISOString().split("T")[0]) } },
    }),
    prisma.message.count({
      where: { session: { chatbotId } },
    }),
    prisma.chatSession.findMany({
      where: { chatbotId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { messages: true } } },
    }),
    exportAll
      ? prisma.chatSession.findMany({
          where: { chatbotId },
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { messages: true } } },
        })
      : Promise.resolve([]),
  ])

  return NextResponse.json({
    totalSessions,
    todaySessions,
    totalMessages,
    recentSessions,
    allSessions: exportAll ? allSessions : undefined,
  })
}

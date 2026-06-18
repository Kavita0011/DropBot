import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const chatbot = await prisma.chatbot.findUnique({
    where: { id },
    select: {
      id: true, name: true, welcomeMsg: true, themeColor: true, bgColor: true,
      textColor: true, position: true, logoUrl: true, status: true, createdAt: true,
    },
  })

  if (!chatbot || chatbot.status !== "approved") {
    return NextResponse.json({ error: "Chatbot not found" }, { status: 404 })
  }

  return NextResponse.json(chatbot)
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const pending = await prisma.chatbot.findMany({
    where: { status: "pending_review" },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(pending)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { chatbotId, status } = await req.json()
  if (!["approved", "rejected", "pending_review"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const existing = await prisma.chatbot.findUnique({ where: { id: chatbotId } })
  if (!existing) {
    return NextResponse.json({ error: "Chatbot not found" }, { status: 404 })
  }

  const chatbot = await prisma.chatbot.update({
    where: { id: chatbotId },
    data: { status },
  })

  return NextResponse.json(chatbot)
}

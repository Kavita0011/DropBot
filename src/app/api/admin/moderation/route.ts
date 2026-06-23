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

  const body = await req.json()

  // Handle single chatbot moderation
  if (body.chatbotId && body.status) {
    const { chatbotId, status, comment } = body
    if (!["approved", "rejected", "pending_review"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const existing = await prisma.chatbot.findUnique({ where: { id: chatbotId } })
    if (!existing) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 })
    }

    const updateData: any = { status }
    if (comment && status === "rejected") {
      updateData.rejectionReason = comment
    }

    const chatbot = await prisma.chatbot.update({
      where: { id: chatbotId },
      data: updateData,
    })

    return NextResponse.json(chatbot)
  }

  // Handle bulk moderation
  if (body.chatbotIds && body.status) {
    const { chatbotIds, status, comment } = body
    if (!Array.isArray(chatbotIds) || chatbotIds.length === 0) {
      return NextResponse.json({ error: "chatbotIds is required and must be a non-empty array" }, { status: 400 })
    }
    if (!["approved", "rejected", "pending_review"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const updateData: any = { status }
    if (comment && status === "rejected") {
      updateData.rejectionReason = comment
    }

    const chatbots = await prisma.chatbot.updateMany({
      where: { id: { in: chatbotIds } },
      data: updateData,
    })

    return NextResponse.json({ updated: chatbots.count })
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 })
}

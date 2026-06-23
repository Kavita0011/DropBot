import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const chatbot = await prisma.chatbot.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!chatbot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(chatbot)
}

const ALLOWED_FIELDS = ["name", "description", "welcomeMsg", "themeColor", "accentColor", "position", "bgColor", "textColor", "flowData", "logoUrl"] as const

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const chatbot = await prisma.chatbot.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!chatbot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field]
  }

  const updated = await prisma.chatbot.update({
    where: { id },
    data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const isAdmin = (session.user as { role?: string }).role === "admin"

  await prisma.chatbot.deleteMany({
    where: isAdmin ? { id } : { id, userId: session.user.id },
  })

  return NextResponse.json({ success: true })
}

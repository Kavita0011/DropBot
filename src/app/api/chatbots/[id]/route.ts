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

  const updated = await prisma.chatbot.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      welcomeMsg: body.welcomeMsg,
      themeColor: body.themeColor,
      accentColor: body.accentColor,
      position: body.position,
      bgColor: body.bgColor,
      textColor: body.textColor,
      flowData: body.flowData,
      status: body.status !== undefined ? body.status : chatbot.status,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await prisma.chatbot.deleteMany({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ success: true })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })

  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, email: true, createdAt: true },
  })

  const allChatbots = await prisma.chatbot.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, userId: true, createdAt: true },
  })

  const payments = await prisma.payment.findMany()

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0)

  const totalUsers = await prisma.user.count()
  const totalChatbots = await prisma.chatbot.count()

  return NextResponse.json({
    totalUsers,
    totalChatbots,
    totalPayments: payments.length,
    totalRevenue: totalRevenue / 100,
    recentUsers: allUsers,
    recentChatbots: allChatbots,
  })
}

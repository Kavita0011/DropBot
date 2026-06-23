import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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

  const [paymentAgg, totalUsers, totalChatbots] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.user.count(),
    prisma.chatbot.count(),
  ])

  return NextResponse.json({
    totalUsers,
    totalChatbots,
    totalPayments: paymentAgg._count,
    totalRevenue: (paymentAgg._sum.amount || 0) / 100,
    recentUsers: allUsers,
    recentChatbots: allChatbots,
  })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  const totalRevenue = payments.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthRevenue = payments.filter((p) => p.status === "completed" && p.createdAt >= monthStart).reduce((s, p) => s + p.amount, 0)

  const pendingPayouts = payments.filter((p) => p.status === "completed" && !p.stripePaymentId).reduce((s, p) => s + p.amount, 0)

  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthPayments = payments.filter((p) => {
      const pd = new Date(p.createdAt)
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear() && p.status === "completed"
    })
    return {
      month: d.toLocaleString("default", { month: "short" }),
      revenue: monthPayments.reduce((s, p) => s + p.amount, 0) / 100,
      count: monthPayments.length,
    }
  }).reverse()

  const userSubscriptions = await prisma.subscription.findMany({
    where: { status: "active" },
    include: { user: { select: { name: true, email: true } } },
  })

  return NextResponse.json({
    totalRevenue: totalRevenue / 100,
    monthRevenue: monthRevenue / 100,
    pendingPayouts: pendingPayouts / 100,
    totalTransactions: payments.length,
    monthlyBreakdown,
    recentTransactions: payments.slice(0, 20).map((p) => ({
      id: p.id,
      user: p.user,
      amount: p.amount / 100,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
    })),
    activeSubscriptions: userSubscriptions.map((s) => ({
      user: s.user,
      plan: s.plan,
      currentPeriodEnd: s.currentPeriodEnd,
    })),
  })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const settings = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {
      stripeAccountId: body.stripeAccountId ?? undefined,
      paypalEmail: body.paypalEmail ?? undefined,
      bankName: body.bankName ?? undefined,
      bankAccount: body.bankAccount ?? undefined,
      payoutSchedule: body.payoutSchedule ?? undefined,
    },
    create: {
      id: "platform",
      ...body,
    },
  })

  return NextResponse.json(settings)
}

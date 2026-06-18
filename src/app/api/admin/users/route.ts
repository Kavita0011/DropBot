import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      subscriptions: { select: { plan: true, status: true, subscriptionEnd: true }, orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { chatbots: true, payments: true } },
    },
  })

  return NextResponse.json(users)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { userId, role, planKey } = body

  if (role && !["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  if (role) {
    await prisma.user.update({ where: { id: userId }, data: { role } })
  }

  if (planKey) {
    const existing = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } })
    const baseDate = existing?.subscriptionEnd && new Date(existing.subscriptionEnd) > new Date() ? new Date(existing.subscriptionEnd) : new Date()
    const newEnd = planKey === "free" ? null : new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { plan: planKey, status: "active", subscriptionEnd: newEnd },
      })
    } else {
      await prisma.subscription.create({
        data: { id: `sub-${userId}-${Date.now()}`, userId, plan: planKey, status: "active", subscriptionEnd: newEnd ?? undefined },
      })
    }
  }

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true,
      subscriptions: { select: { plan: true, status: true, subscriptionEnd: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  })

  return NextResponse.json(updated)
}

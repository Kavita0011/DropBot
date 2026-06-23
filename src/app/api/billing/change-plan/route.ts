import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { planKey } = await req.json()
  if (!planKey) {
    return NextResponse.json({ error: "planKey is required" }, { status: 400 })
  }

  const plan = await prisma.plan.findUnique({ where: { key: planKey } })
  if (!plan || !plan.active) {
    return NextResponse.json({ error: "Invalid or inactive plan" }, { status: 400 })
  }

  const isAdmin = (session?.user as { role?: string })?.role === "admin"

  // Non-admin users can only downgrade to free (cancel subscription)
  // Admin can switch to any plan without payment
  if (!isAdmin && planKey !== "free") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sub = await prisma.subscription.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  const baseDate = sub?.subscriptionEnd && new Date(sub.subscriptionEnd) > new Date()
    ? new Date(sub.subscriptionEnd) : new Date()
  const subEnd = planKey === "free" ? null : new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)

  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { plan: planKey, status: planKey === "free" ? "inactive" : "active", subscriptionEnd: subEnd },
    })
  } else {
    if (planKey !== "free") {
      await prisma.subscription.create({
        data: {
          id: `sub-${session.user.id}-${Date.now()}`,
          userId: session.user.id,
          plan: planKey,
          status: "active",
          subscriptionEnd: subEnd,
        },
      })
    }
  }

  return NextResponse.json({ success: true, plan: planKey, subscriptionEnd: subEnd?.toISOString() || null })
}
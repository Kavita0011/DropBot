import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const submissions = await prisma.paymentScreenshot.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(submissions)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id, status, adminNote } = await req.json()

  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const submission = await prisma.paymentScreenshot.findUnique({ where: { id }, include: { user: true } })
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  const updated = await prisma.paymentScreenshot.update({
    where: { id },
    data: { status, adminNote: adminNote || null },
  })

  if (status === "approved") {
    const existingSub = await prisma.subscription.findFirst({ where: { userId: submission.userId }, orderBy: { createdAt: "desc" } })
    const baseDate = existingSub?.subscriptionEnd && new Date(existingSub.subscriptionEnd) > new Date() ? new Date(existingSub.subscriptionEnd) : new Date()
    const subEnd = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: { plan: submission.planKey, status: "active", subscriptionEnd: subEnd },
      })
    } else {
      await prisma.subscription.create({
        data: {
          id: `sub-${submission.userId}-${Date.now()}`,
          userId: submission.userId,
          plan: submission.planKey,
          status: "active",
          subscriptionEnd: subEnd,
        },
      })
    }

    await prisma.payment.create({
      data: {
        userId: submission.userId,
        amount: submission.amount,
        currency: submission.currency,
        status: "completed",
      },
    })
  }

  return NextResponse.json(updated)
}
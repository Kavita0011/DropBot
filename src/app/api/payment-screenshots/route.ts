import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { planKey, amount, currency, screenshotUrl, upiRef, bankRef, notes } = await req.json()

  if (!planKey || !amount) {
    return NextResponse.json({ error: "planKey and amount are required" }, { status: 400 })
  }

  if (amount <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
  }

  const plan = await prisma.plan.findUnique({ where: { key: planKey } })
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  const submission = await prisma.paymentScreenshot.create({
    data: {
      userId: session.user.id,
      planKey,
      amount,
      currency: currency || "inr",
      screenshotUrl: screenshotUrl || null,
      upiRef: upiRef || null,
      bankRef: bankRef || null,
      notes: notes || null,
    },
  })

  return NextResponse.json(submission, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const submissions = await prisma.paymentScreenshot.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(submissions)
}
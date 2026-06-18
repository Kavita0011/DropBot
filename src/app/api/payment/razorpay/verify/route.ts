import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { verifyPayment } from "@/lib/razorpay"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planKey, gst, address, phone, name } = await req.json()

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planKey) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
  }

  const valid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
  if (!valid) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
  }

  const plan = await prisma.plan.findUnique({ where: { key: planKey } })
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } })

  const existingSub = await prisma.subscription.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
  const baseDate = existingSub?.subscriptionEnd && new Date(existingSub.subscriptionEnd) > new Date()
    ? new Date(existingSub.subscriptionEnd) : new Date()
  const subEnd = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  const graceEnd = new Date(subEnd.getTime() + 5 * 24 * 60 * 60 * 1000)

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      amount: plan.priceInr || plan.price,
      currency: "inr",
      status: "completed",
      method: "razorpay",
      planKey,
      email: user?.email || "",
      phone: phone || "",
      gst: gst || "",
      address: address || "",
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    },
  })

  if (existingSub) {
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: { plan: planKey, status: "active", subscriptionEnd: subEnd, graceEnd },
    })
  } else {
    await prisma.subscription.create({
      data: {
        id: `sub-${session.user.id}-${Date.now()}`,
        userId: session.user.id,
        plan: planKey,
        status: "active",
        subscriptionEnd: subEnd,
        graceEnd,
      },
    })
  }

  return NextResponse.json({ success: true, planKey, subscriptionEnd: subEnd.toISOString(), graceEnd: graceEnd.toISOString() })
}
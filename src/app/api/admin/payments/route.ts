import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { refundPayment } from "@/lib/razorpay"

export async function GET() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(payments)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Payment ID required" }, { status: 400 })

  const payment = await prisma.payment.findUnique({ where: { id } })
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  if (payment.status !== "completed") return NextResponse.json({ error: "Only completed payments can be refunded" }, { status: 400 })

  if (payment.razorpayPaymentId) {
    try {
      await refundPayment(payment.razorpayPaymentId)
    } catch (e: any) {
      return NextResponse.json({ error: "Razorpay refund failed: " + (e?.message || "unknown") }, { status: 502 })
    }
  }

  await prisma.payment.update({
    where: { id },
    data: { status: "refunded", refundedAt: new Date(), refundId: `refund-${id}-${Date.now()}` },
  })

  return NextResponse.json({ success: true })
}
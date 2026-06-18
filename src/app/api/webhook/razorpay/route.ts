import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  const body = await req.text()
  const signature = req.headers.get("x-razorpay-signature")

  if (secret && signature) {
    const { createHmac } = await import("crypto")
    const expected = createHmac("sha256", secret).update(body).digest("hex")
    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  let event: any
  try { event = JSON.parse(body) } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity
    const orderId = payment.order_id
    const razorpayPaymentId = payment.id

    const existing = await prisma.payment.findFirst({ where: { razorpayOrderId: orderId } })
    if (existing && existing.status !== "completed") {
      await prisma.payment.update({ where: { id: existing.id }, data: { status: "completed", razorpayPaymentId } })
    }
  }

  if (event.event === "payment.failed") {
    const payment = event.payload.payment.entity
    const orderId = payment.order_id
    await prisma.payment.updateMany({ where: { razorpayOrderId: orderId }, data: { status: "failed" } })
  }

  return NextResponse.json({ received: true })
}

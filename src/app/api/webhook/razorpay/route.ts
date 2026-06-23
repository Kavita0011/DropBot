import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createHmac, timingSafeEqual } from "crypto"

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  const body = await req.text()
  const signature = req.headers.get("x-razorpay-signature")

  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 })
  }
  const expected = createHmac("sha256", secret).update(body).digest()
  const sig = Buffer.from(signature, "hex")
  if (expected.length !== sig.length || !timingSafeEqual(expected, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
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

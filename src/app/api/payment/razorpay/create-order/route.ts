import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createOrder } from "@/lib/razorpay"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { planKey, currency, gst, address, phone, name } = await req.json()
  if (!planKey || currency !== "inr") {
    return NextResponse.json({ error: "Only INR payments supported via Razorpay." }, { status: 400 })
  }

  const plan = await prisma.plan.findUnique({ where: { key: planKey } })
  if (!plan || !plan.active) {
    return NextResponse.json({ error: "Invalid or inactive plan" }, { status: 400 })
  }

  if (!plan.priceInr || plan.priceInr <= 0) {
    return NextResponse.json({ error: "Invalid plan amount" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } })

  const result = await createOrder(plan.priceInr, "INR", `order_${session.user.id}_${Date.now()}`)
  if (!result) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 })
  }

  return NextResponse.json({
    order_id: result.id,
    amount: result.amount,
    currency: result.currency,
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    user: { name: user?.name || name || "", email: user?.email || "", phone: phone || "" },
    gst: gst || "",
    address: address || "",
  })
}
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

  const missing = [
    !process.env.RAZORPAY_KEY_ID ? "RAZORPAY_KEY_ID" : null,
    !process.env.RAZORPAY_KEY_SECRET ? "RAZORPAY_KEY_SECRET" : null,
    !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? "NEXT_PUBLIC_RAZORPAY_KEY_ID" : null,
  ].filter(Boolean)
  if (missing.length > 0) {
    console.error("Razorpay 503: missing env vars:", missing.join(", "))
    return NextResponse.json({ error: "Razorpay not configured", missing }, { status: 503 })
  }

  let result
  try {
    const shortId = session.user.id.slice(0, 8)
    result = await createOrder(plan.priceInr, "INR", `ord_${shortId}_${Date.now()}`)
  } catch (e: any) {
    console.error("Razorpay exception:", e?.message || e)
    return NextResponse.json({ error: "Razorpay exception: " + (e?.message || "unknown") }, { status: 503 })
  }
  if (!result) {
    return NextResponse.json({ error: "Razorpay not configured — API request failed" }, { status: 503 })
  }

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      amount: plan.priceInr,
      currency: "inr",
      status: "pending",
      method: "razorpay",
      planKey,
      email: user?.email || "",
      phone: phone || "",
      gst: gst || "",
      address: address || "",
      razorpayOrderId: result.id,
    },
  })

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
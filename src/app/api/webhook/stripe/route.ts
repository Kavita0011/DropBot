import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { customer: string; id: string; amount_total: number }

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: session.customer },
    })

    if (user) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: session.amount_total,
          stripePaymentId: session.id,
          status: "completed",
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}

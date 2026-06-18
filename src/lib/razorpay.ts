const Razorpay = require("razorpay")

interface RazorpayOrderResult {
  id: string; amount: number; amount_due: number; amount_paid: number
  currency: string; receipt: string; status: string; attempts: number; created_at: number
}

function getClient() {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) return null
  return new Razorpay({ key_id, key_secret })
}

export async function createOrder(amount: number, currency: string, receipt: string): Promise<RazorpayOrderResult | null> {
  const client = getClient()
  if (!client) return null
  const order = await client.orders.create({
    amount: Math.round(amount),
    currency: currency.toUpperCase(),
    receipt,
    payment_capture: 1,
  })
  return order as RazorpayOrderResult
}

export function verifyPayment(orderId: string, paymentId: string, signature: string) {
  const { createHmac } = require("crypto") as typeof import("crypto")
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return false
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex")
  return expected === signature
}

export function getKeyId() {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
}
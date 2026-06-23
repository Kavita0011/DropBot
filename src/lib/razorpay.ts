import { createHmac, timingSafeEqual } from "crypto"

interface RazorpayOrderResult {
  id: string; amount: number; amount_due: number; amount_paid: number
  currency: string; receipt: string; status: string; attempts: number; created_at: number
}

function getAuth(): { key_id: string; key_secret: string } | null {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) return null
  return { key_id, key_secret }
}

async function razorpayPost(path: string, body: Record<string, unknown>) {
  const auth = getAuth()
  if (!auth) return null
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${auth.key_id}:${auth.key_secret}`).toString("base64"),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => "unknown")
    throw new Error(`Razorpay API ${res.status}: ${errBody}`)
  }
  return res.json()
}

export async function createOrder(amount: number, currency: string, receipt: string): Promise<RazorpayOrderResult | null> {
  return razorpayPost("/orders", {
    amount: Math.round(amount),
    currency: currency.toUpperCase(),
    receipt,
    payment_capture: 1,
  }) as Promise<RazorpayOrderResult | null>
}

export function verifyPayment(orderId: string, paymentId: string, signature: string) {
  const auth = getAuth()
  if (!auth) return false
  const expected = createHmac("sha256", auth.key_secret).update(`${orderId}|${paymentId}`).digest()
  const sig = Buffer.from(signature, "hex")
  if (expected.length !== sig.length) return false
  return timingSafeEqual(expected, sig)
}

export async function refundPayment(paymentId: string, amount?: number) {
  return razorpayPost(`/payments/${paymentId}/refund`, amount ? { amount } : {})
}

export function getKeyId() {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
}

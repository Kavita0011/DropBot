import Stripe from "stripe"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" })
}

export const stripe = getStripe()

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    chatbots: 1,
    nodes: 10,
    chats: 100,
  },
  pro: {
    name: "Pro",
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    chatbots: 5,
    nodes: 50,
    chats: 5000,
  },
  business: {
    name: "Business",
    price: 99,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID!,
    chatbots: -1,
    nodes: -1,
    chats: -1,
  },
} as const

export type PlanKey = keyof typeof PLANS

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash("password123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "devappkavita@gmail.com" },
    update: { role: "admin" },
    create: {
      name: "Admin",
      email: "devappkavita@gmail.com",
      password,
      role: "admin",
    },
  })

  await prisma.subscription.upsert({
    where: { id: `sub-${admin.id}` },
    update: {},
    create: {
      id: `sub-${admin.id}`,
      userId: admin.id,
      plan: "business",
      status: "active",
    },
  })

  const demo = await prisma.user.upsert({
    where: { email: "demo@dropbot.ai" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@dropbot.ai",
      password,
    },
  })

  await prisma.subscription.upsert({
    where: { id: `sub-${demo.id}` },
    update: {},
    create: {
      id: `sub-${demo.id}`,
      userId: demo.id,
      plan: "pro",
      status: "active",
    },
  })

  const existing = await prisma.chatbot.findFirst({ where: { userId: demo.id } })
  if (!existing) {
    await prisma.chatbot.create({
      data: {
        userId: demo.id,
        name: "Support Bot",
        description: "Customer support chatbot example",
        status: "approved",
        flowData: JSON.stringify({
          nodes: [
            { id: "welcome", type: "welcome", position: { x: 300, y: 50 }, data: { message: "Hi! How can I help you today?" } },
            { id: "msg-1", type: "message", position: { x: 300, y: 200 }, data: { message: "I can help with FAQs, orders, and support." } },
            { id: "end-1", type: "end", position: { x: 300, y: 350 }, data: { message: "Thanks for chatting!" } },
          ],
          edges: [
            { id: "e1", source: "welcome", target: "msg-1" },
            { id: "e2", source: "msg-1", target: "end-1" },
          ],
        }),
      },
    })
  }

  console.log("Seeded:")
  console.log("  Admin: devappkavita@gmail.com / password123")
  console.log("  Demo:  demo@dropbot.ai / password123")

  const plans = [
    { key: "free", name: "Free", price: 0, chatbots: 1, nodes: 10, chats: 100, features: JSON.stringify(["1 chatbot", "10 nodes", "100 chats/month"]), popular: false },
    { key: "pro", name: "Pro", price: 2900, chatbots: 5, nodes: 50, chats: 5000, priceId: process.env.STRIPE_PRO_PRICE_ID || "", features: JSON.stringify(["5 chatbots", "50 nodes", "5,000 chats/month", "AI responses"]), popular: true },
    { key: "business", name: "Business", price: 9900, chatbots: -1, nodes: -1, chats: -1, priceId: process.env.STRIPE_BUSINESS_PRICE_ID || "", features: JSON.stringify(["Unlimited chatbots", "Unlimited nodes", "Unlimited chats", "Custom branding"]), popular: false },
  ]

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { key: p.key },
      update: p,
      create: p,
    })
  }

  console.log("  Plans: Free, Pro, Business")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

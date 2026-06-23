import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
    select: { id: true, name: true, key: true, description: true, price: true, priceInr: true, currency: true, chatbots: true, nodes: true, chats: true, features: true, popular: true },
  })
  return NextResponse.json(plans)
}

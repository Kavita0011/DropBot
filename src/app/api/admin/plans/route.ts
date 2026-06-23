import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
const PLAN_FIELDS = ["name", "key", "description", "price", "priceInr", "currency", "priceId", "chatbots", "nodes", "chats", "features", "popular", "active"] as const

export async function GET() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } })
  return NextResponse.json(plans)
}

export async function POST(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  if (!body.name || !body.key) {
    return NextResponse.json({ error: "name and key are required" }, { status: 400 })
  }
  const data: Record<string, unknown> = {}
  for (const f of PLAN_FIELDS) {
    if (body[f] !== undefined) data[f] = body[f]
  }
  const plan = await prisma.plan.create({ data: data as never })
  return NextResponse.json(plan, { status: 201 })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const data: Record<string, unknown> = {}
  for (const f of PLAN_FIELDS) {
    if (body[f] !== undefined) data[f] = body[f]
  }
  const plan = await prisma.plan.update({ where: { id: body.id }, data: data as never })
  return NextResponse.json(plan)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const plan = await prisma.plan.findUnique({ where: { id }, select: { key: true } })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  const inUse = await prisma.subscription.findFirst({ where: { plan: plan.key, status: "active" } })
  if (inUse) {
    return NextResponse.json({ error: "Cannot delete — plan is assigned to active subscriptions" }, { status: 409 })
  }

  await prisma.plan.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
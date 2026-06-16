import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
  const plan = await prisma.plan.create({ data: body })
  return NextResponse.json(plan, { status: 201 })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id, ...data } = await req.json()
  const plan = await prisma.plan.update({ where: { id }, data })
  return NextResponse.json(plan)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await req.json()
  await prisma.plan.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

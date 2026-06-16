import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const settings = await prisma.platformSettings.findUnique({ where: { id: "platform" } })
  return NextResponse.json(settings || {})
}

export async function PUT(req: Request) {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const settings = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {
      upiId: body.upiId,
      bankDisplayName: body.bankDisplayName,
      bankAccountNumber: body.bankAccountNumber,
      bankIfsc: body.bankIfsc,
      bankAccountHolder: body.bankAccountHolder,
    },
    create: {
      id: "platform",
      upiId: body.upiId,
      bankDisplayName: body.bankDisplayName,
      bankAccountNumber: body.bankAccountNumber,
      bankIfsc: body.bankIfsc,
      bankAccountHolder: body.bankAccountHolder,
    },
  })

  return NextResponse.json(settings)
}
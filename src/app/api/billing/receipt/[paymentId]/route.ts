import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { paymentId } = await params

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { name: true, email: true } } },
  })

  if (!payment || payment.userId !== session.user.id) {
    const isAdmin = (session?.user as { role?: string })?.role === "admin"
    if (!isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
  }

  return NextResponse.json(payment)
}
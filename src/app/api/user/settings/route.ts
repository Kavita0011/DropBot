import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, currentPassword, newPassword } = await req.json()

  const updateData: Record<string, unknown> = {}

  if (name !== undefined) {
    const cleaned = String(name).trim().replace(/[<>]/g, "").slice(0, 100)
    if (cleaned) updateData.name = cleaned
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 })
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return NextResponse.json({ error: "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } })
    if (!user?.password || !(await bcrypt.compare(currentPassword, user.password))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 })
    }
    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json(updated)
}
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    let { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    email = String(email).trim().toLowerCase().replace(/[<>]/g, "")
    name = String(name || "").trim().replace(/[<>]/g, "")
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name || email.split("@")[0],
          email,
          password: hashedPassword,
        },
      })

      await tx.subscription.create({
        data: {
          userId: user.id,
          plan: "free",
          status: "active",
        },
      })

      return user
    })

    return NextResponse.json({ id: result.id, email: result.email }, { status: 201 })
  } catch (e) {
    console.error("Register error:", e)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

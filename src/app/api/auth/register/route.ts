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
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        password: hashedPassword,
      },
    })

    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "free",
        status: "active",
      },
    })

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (e) {
    console.error("Register error:", e)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

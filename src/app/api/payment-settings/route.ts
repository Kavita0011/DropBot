import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const settings = await prisma.platformSettings.findUnique({ where: { id: "platform" } })
  if (!settings) {
    return NextResponse.json({ upiId: null, bankDisplayName: null, bankAccountNumber: null, bankIfsc: null, bankAccountHolder: null })
  }
  return NextResponse.json({
    upiId: settings.upiId,
    bankDisplayName: settings.bankDisplayName,
    bankAccountNumber: settings.bankAccountNumber,
    bankIfsc: settings.bankIfsc,
    bankAccountHolder: settings.bankAccountHolder,
  })
}
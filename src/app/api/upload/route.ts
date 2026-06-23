import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_SIZE = 5 * 1024 * 1024

const MAGIC: Record<string, Uint8Array[]> = {
  "image/png": [new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/gif": [new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])],
}

const EXT_MAP: Record<string, string> = {
  "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif",
}

function validateMagic(buffer: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/webp") {
    if (buffer.length < 12) return false
    const riff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
    const webp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    return riff && webp
  }
  const sigs = MAGIC[mimeType]
  if (!sigs) return false
  return sigs.some((sig) => {
    if (buffer.length < sig.length) return false
    return sig.every((b, i) => buffer[i] === b)
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPEG, WebP, and GIF images are allowed" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large — max 5MB" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const raw = new Uint8Array(bytes)
  if (!validateMagic(raw, file.type)) {
    return NextResponse.json({ error: "File content does not match expected image type" }, { status: 400 })
  }

  const ext = EXT_MAP[file.type] || ".png"
  const filename = `${randomUUID()}${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), Buffer.from(raw))

  return NextResponse.json({ url: `/uploads/${filename}` })
}
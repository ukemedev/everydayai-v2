import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"

export async function PUT(req: Request) {
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { openaiApiKey } = await req.json()

  await db.user.update({
    where: { id: user.id },
    data: { openaiApiKey: openaiApiKey || null },
  })

  return NextResponse.json({ message: "API key saved" })
}

export async function DELETE() {
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  await db.user.update({
    where: { id: user.id },
    data: { openaiApiKey: null },
  })

  return NextResponse.json({ message: "API key cleared" })
}

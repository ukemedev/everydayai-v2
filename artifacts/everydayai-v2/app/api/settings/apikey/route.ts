import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse("User not found", { status: 404 })

  const { openaiApiKey } = await req.json()

  await db.user.update({
    where: { id: user.id },
    data: { openaiApiKey },
  })

  return NextResponse.json({ message: "API key saved" })
}

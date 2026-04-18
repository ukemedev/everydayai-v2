import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse("User not found", { status: 404 })

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404 })

  const widgetToken = randomBytes(32).toString("hex")

  const updated = await db.agent.update({
    where: { id: agent.id },
    data: { isPublished: true, widgetToken },
  })

  return NextResponse.json(updated)
}

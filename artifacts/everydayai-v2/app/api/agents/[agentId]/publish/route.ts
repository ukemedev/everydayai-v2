import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404 })

  const widgetToken = agent.widgetToken ?? randomBytes(32).toString("hex")

  const updated = await db.agent.update({
    where: { id: agent.id },
    data: { isPublished: true, widgetToken },
  })

  return NextResponse.json(updated)
}

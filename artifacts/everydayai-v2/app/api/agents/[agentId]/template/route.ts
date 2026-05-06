import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Not found", { status: 404 })

  const { templateCategory } = await req.json().catch(() => ({}))

  const updated = await db.agent.update({
    where: { id: agent.id },
    data: {
      isTemplate: !agent.isTemplate,
      templateCategory: !agent.isTemplate ? (templateCategory || "Support") : null,
    },
  })

  return NextResponse.json(updated)
}

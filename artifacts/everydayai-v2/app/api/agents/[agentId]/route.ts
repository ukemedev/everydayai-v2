import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"
import OpenAI from "openai"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
    include: { knowledgeFiles: true },
  })

  if (!agent) return new NextResponse("Agent not found", { status: 404 })
  return NextResponse.json(agent)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404 })

  const { name, description, systemPrompt, model } = await req.json()

  const updated = await db.agent.update({
    where: { id: agent.id },
    data: { name, description, systemPrompt, model },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
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

  if (user.openaiApiKey) {
    try {
      const client = new OpenAI({ apiKey: user.openaiApiKey })
      if (agent.openaiAssistantId) {
        await client.beta.assistants.delete(agent.openaiAssistantId)
      }
      if (agent.openaiVectorStoreId) {
        await client.vectorStores.delete(agent.openaiVectorStoreId)
      }
    } catch {
      // OpenAI cleanup failed — proceed with DB delete anyway
    }
  }

  await db.agent.delete({ where: { id: agent.id } })
  return NextResponse.json({ message: "Agent deleted" })
}

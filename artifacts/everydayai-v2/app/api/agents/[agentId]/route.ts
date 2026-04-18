import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import OpenAI from "openai"
import { generateToken } from "@/lib/utils"

export async function GET(
  req: Request,
  { params }: { params: { agentId: string } }
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse("User not found", { status: 404 })

  const agent = await db.agent.findFirst({
    where: { id: Number(params.agentId), ownerId: user.id },
    include: { knowledgeFiles: true },
  })

  if (!agent) return new NextResponse("Agent not found", { status: 404 })
  return NextResponse.json(agent)
}

export async function PUT(
  req: Request,
  { params }: { params: { agentId: string } }
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse("User not found", { status: 404 })

  const agent = await db.agent.findFirst({
    where: { id: Number(params.agentId), ownerId: user.id },
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
  req: Request,
  { params }: { params: { agentId: string } }
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse("User not found", { status: 404 })

  const agent = await db.agent.findFirst({
    where: { id: Number(params.agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404 })

  if (user.openaiApiKey) {
    const client = new OpenAI({ apiKey: user.openaiApiKey })
    if (agent.openaiAssistantId) {
      await client.beta.assistants.del(agent.openaiAssistantId)
    }
    if (agent.openaiVectorStoreId) {
      await client.beta.vectorStores.del(agent.openaiVectorStoreId)
    }
  }

  await db.agent.delete({ where: { id: agent.id } })
  return NextResponse.json({ message: "Agent deleted" })
}

import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"
import OpenAI from "openai"
import { syncToolsToAssistant } from "@/lib/sync-agent-tools"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Not found", { status: 404 })

  const tools = await db.agentTool.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(tools)
}

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

  const body = await req.json()
  const { name, description, method, url, headers, parameters } = body

  if (!name || !description || !url) {
    return NextResponse.json({ error: "name, description, and url are required" }, { status: 400 })
  }

  const safeName = name.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()

  const tool = await db.agentTool.create({
    data: {
      agentId: agent.id,
      name: safeName,
      description,
      method: method || "POST",
      url,
      headers: headers || null,
      parameters: parameters || null,
    },
  })

  if (user.openaiApiKey && agent.openaiAssistantId) {
    try {
      const allTools = await db.agentTool.findMany({ where: { agentId: agent.id } })
      const client = new OpenAI({ apiKey: user.openaiApiKey })
      await syncToolsToAssistant(client, agent.openaiAssistantId, allTools)
    } catch {
      // Sync failure should not block tool creation
    }
  }

  return NextResponse.json(tool)
}

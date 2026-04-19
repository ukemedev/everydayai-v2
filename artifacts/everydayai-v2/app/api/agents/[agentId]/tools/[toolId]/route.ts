import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"
import OpenAI from "openai"
import { syncToolsToAssistant } from "@/lib/sync-agent-tools"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ agentId: string; toolId: string }> }
) {
  const { agentId, toolId } = await params
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Not found", { status: 404 })

  const tool = await db.agentTool.findFirst({
    where: { id: Number(toolId), agentId: agent.id },
  })
  if (!tool) return new NextResponse("Tool not found", { status: 404 })

  await db.agentTool.delete({ where: { id: tool.id } })

  if (user.openaiApiKey && agent.openaiAssistantId) {
    try {
      const remaining = await db.agentTool.findMany({ where: { agentId: agent.id } })
      const client = new OpenAI({ apiKey: user.openaiApiKey })
      await syncToolsToAssistant(client, agent.openaiAssistantId, remaining)
    } catch {
      // Non-blocking
    }
  }

  return NextResponse.json({ message: "Tool deleted" })
}

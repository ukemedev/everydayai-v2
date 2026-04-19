import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"
import OpenAI from "openai"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ agentId: string; fileId: string }> }
) {
  const { agentId, fileId } = await params
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404 })

  const file = await db.knowledgeFile.findFirst({
    where: { id: Number(fileId), agentId: agent.id },
  })
  if (!file) return new NextResponse("File not found", { status: 404 })

  if (user.openaiApiKey && file.openaiFileId) {
    try {
      const client = new OpenAI({ apiKey: user.openaiApiKey })
      await client.files.delete(file.openaiFileId)
    } catch {
      // If OpenAI delete fails, still remove from DB
    }
  }

  await db.knowledgeFile.delete({ where: { id: file.id } })
  return NextResponse.json({ message: "File deleted" })
}

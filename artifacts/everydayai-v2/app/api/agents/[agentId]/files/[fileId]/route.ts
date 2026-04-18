import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import OpenAI from "openai"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ agentId: string; fileId: string }> }
) {
  const { agentId, fileId } = await params

  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse("User not found", { status: 404 })

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404 })

  const file = await db.knowledgeFile.findFirst({
    where: { id: Number(fileId), agentId: agent.id },
  })
  if (!file) return new NextResponse("File not found", { status: 404 })

  if (user.openaiApiKey && file.openaiFileId) {
    const client = new OpenAI({ apiKey: user.openaiApiKey })
    await client.files.del(file.openaiFileId)
  }

  await db.knowledgeFile.delete({ where: { id: file.id } })
  return NextResponse.json({ message: "File deleted" })
}

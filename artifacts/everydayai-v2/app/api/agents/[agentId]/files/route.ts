import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import OpenAI from "openai"

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
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404 })

  const files = await db.knowledgeFile.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(files)
}

export async function POST(
  req: Request,
  { params }: { params: { agentId: string } }
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse("User not found", { status: 404 })

  if (!user.openaiApiKey) {
    return NextResponse.json(
      { error: "No OpenAI API key found." },
      { status: 400 }
    )
  }

  const agent = await db.agent.findFirst({
    where: { id: Number(params.agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return new NextResponse("No file provided", { status: 400 })

  const client = new OpenAI({ apiKey: user.openaiApiKey })

  const openaiFile = await client.files.create({
    file,
    purpose: "assistants",
  })

  await client.beta.vectorStores.files.create(
    agent.openaiVectorStoreId!,
    { file_id: openaiFile.id }
  )

  const knowledgeFile = await db.knowledgeFile.create({
    data: {
      filename: file.name,
      openaiFileId: openaiFile.id,
      agentId: agent.id,
    },
  })

  return NextResponse.json(knowledgeFile)
}

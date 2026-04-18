import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import OpenAI from "openai"

async function runChat(
  client: OpenAI,
  assistantId: string,
  message: string,
  threadId?: string
) {
  const thread = threadId
    ? await client.beta.threads.retrieve(threadId)
    : await client.beta.threads.create()

  await client.beta.threads.messages.create(thread.id, {
    role: "user",
    content: message,
  })

  let run = await client.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
  })

  while (run.status === "queued" || run.status === "in_progress") {
    await new Promise((r) => setTimeout(r, 1000))
    run = await client.beta.threads.runs.retrieve(run.id, { thread_id: thread.id })
  }

  if (run.status === "failed") {
    throw new Error("Assistant run failed")
  }

  const messages = await client.beta.threads.messages.list(thread.id)
  const content = messages.data[0].content[0]
  const reply = content.type === "text" ? content.text.value : ""

  return { reply, threadId: thread.id }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse("User not found", { status: 404 })

  if (!user.openaiApiKey) {
    return NextResponse.json(
      { error: "No OpenAI API key found. Please add your API key in settings." },
      { status: 400 }
    )
  }

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404 })

  const { message, threadId } = await req.json()
  const client = new OpenAI({ apiKey: user.openaiApiKey })

  const result = await runChat(
    client,
    agent.openaiAssistantId!,
    message,
    threadId
  )

  const existing = await db.conversation.findFirst({
    where: { openaiThreadId: result.threadId },
  })

  if (!existing) {
    await db.conversation.create({
      data: {
        agentId: agent.id,
        openaiThreadId: result.threadId,
      },
    })
  }

  return NextResponse.json(result)
}

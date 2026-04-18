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
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const agent = await db.agent.findFirst({
    where: { widgetToken: token, isPublished: true },
    include: { owner: true },
  })

  if (!agent) return new NextResponse("Agent not found", { status: 404 })

  if (!agent.owner.openaiApiKey) {
    return NextResponse.json(
      { error: "Agent owner has no OpenAI API key configured." },
      { status: 400 }
    )
  }

  const { message, threadId } = await req.json()
  const client = new OpenAI({ apiKey: agent.owner.openaiApiKey })

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

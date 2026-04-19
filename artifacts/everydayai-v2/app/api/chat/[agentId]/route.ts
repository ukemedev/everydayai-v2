import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
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
    await new Promise((r) => setTimeout(r, 800))
    run = await client.beta.threads.runs.retrieve(run.id, {
      thread_id: thread.id,
    })
  }

  if (run.status === "failed") {
    throw new Error(run.last_error?.message || "Assistant run failed")
  }

  const messages = await client.beta.threads.messages.list(thread.id)
  const content = messages.data[0]?.content[0]
  const reply = content?.type === "text" ? content.text.value : ""

  return {
    reply,
    threadId: thread.id,
    usage: run.usage,
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  if (!user.openaiApiKey) {
    return NextResponse.json(
      { error: "No OpenAI API key found. Add your key in Settings." },
      { status: 400 }
    )
  }

  const agent = await db.agent.findFirst({
    where: { id: Number(agentId), ownerId: user.id },
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404 })
  if (!agent.openaiAssistantId) {
    return NextResponse.json({ error: "Agent has no OpenAI assistant." }, { status: 400 })
  }

  const { message, threadId } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 })
  }

  const client = new OpenAI({ apiKey: user.openaiApiKey })

  const result = await runChat(client, agent.openaiAssistantId, message, threadId)

  const existing = await db.conversation.findFirst({
    where: { openaiThreadId: result.threadId },
  })
  if (!existing) {
    await db.conversation.create({
      data: { agentId: agent.id, openaiThreadId: result.threadId },
    })
  }

  return NextResponse.json(result)
}

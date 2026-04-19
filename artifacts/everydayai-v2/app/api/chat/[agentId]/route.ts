import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"
import OpenAI from "openai"

type ToolDef = {
  id: number
  name: string
  description: string
  method: string
  url: string
  headers: unknown
  parameters: unknown
}

async function executeToolCall(
  toolCall: { id: string; function: { name: string; arguments: string } },
  tools: ToolDef[]
) {
  const tool = tools.find((t) => t.name === toolCall.function.name)

  if (!tool) {
    return { tool_call_id: toolCall.id, output: JSON.stringify({ error: "Tool not found" }) }
  }

  try {
    const args = JSON.parse(toolCall.function.arguments || "{}")
    const customHeaders = (tool.headers as Record<string, string>) || {}
    const fetchHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    }

    const fetchOptions: RequestInit = {
      method: tool.method,
      headers: fetchHeaders,
    }

    if (tool.method !== "GET") {
      fetchOptions.body = JSON.stringify(args)
    }

    const response = await fetch(tool.url, fetchOptions)
    const text = await response.text()
    return { tool_call_id: toolCall.id, output: text }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { tool_call_id: toolCall.id, output: JSON.stringify({ error: msg }) }
  }
}

async function runChat(
  client: OpenAI,
  assistantId: string,
  message: string,
  tools: ToolDef[],
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

  while (true) {
    if (run.status === "completed") break

    if (
      run.status === "failed" ||
      run.status === "cancelled" ||
      run.status === "expired"
    ) {
      throw new Error(run.last_error?.message || `Run ${run.status}`)
    }

    if (run.status === "requires_action") {
      const toolCalls = run.required_action!.submit_tool_outputs.tool_calls
      const outputs = await Promise.all(
        toolCalls.map((tc) => executeToolCall(tc, tools))
      )
      run = await client.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
        tool_outputs: outputs,
      })
      continue
    }

    await new Promise((r) => setTimeout(r, 800))
    run = await client.beta.threads.runs.retrieve(thread.id, run.id)
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
    include: { agentTools: true },
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

  const result = await runChat(
    client,
    agent.openaiAssistantId,
    message,
    agent.agentTools,
    threadId
  )

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

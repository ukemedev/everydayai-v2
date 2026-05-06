import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import OpenAI from "openai"

type ToolDef = { name: string; method: string; url: string; headers: unknown }

async function executeToolCall(
  tc: { id: string; function: { name: string; arguments: string } },
  tools: ToolDef[]
) {
  const tool = tools.find((t) => t.name === tc.function.name)
  if (!tool) return { tool_call_id: tc.id, output: JSON.stringify({ error: "Tool not found" }) }
  try {
    const args = JSON.parse(tc.function.arguments || "{}")
    const extra = (tool.headers as Record<string, string>) || {}
    const opts: RequestInit = {
      method: tool.method,
      headers: { "Content-Type": "application/json", ...extra },
    }
    if (tool.method !== "GET") opts.body = JSON.stringify(args)
    const res = await fetch(tool.url, opts)
    return { tool_call_id: tc.id, output: await res.text() }
  } catch (e: unknown) {
    return {
      tool_call_id: tc.id,
      output: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
    }
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

  await client.beta.threads.messages.create(thread.id, { role: "user", content: message })
  let run = await client.beta.threads.runs.create(thread.id, { assistant_id: assistantId })

  while (true) {
    if (run.status === "completed") break
    if (["failed", "cancelled", "expired"].includes(run.status)) {
      throw new Error(run.last_error?.message || `Run ${run.status}`)
    }
    if (run.status === "requires_action") {
      const tcs = run.required_action!.submit_tool_outputs.tool_calls
      const outputs = await Promise.all(tcs.map((tc) => executeToolCall(tc, tools)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      run = await (client.beta.threads.runs as any).submitToolOutputs(thread.id, run.id, { tool_outputs: outputs })
      continue
    }
    await new Promise((r) => setTimeout(r, 800))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    run = await (client.beta.threads.runs as any).retrieve(thread.id, run.id)
  }

  const msgs = await client.beta.threads.messages.list(thread.id)
  const content = msgs.data[0]?.content[0]
  return { reply: content?.type === "text" ? content.text.value : "", threadId: thread.id }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const agent = await db.agent.findFirst({
    where: { widgetToken: token, isPublished: true },
    select: { name: true, description: true },
  })
  if (!agent) return new NextResponse("Not found", { status: 404, headers: CORS })
  return NextResponse.json(agent, { headers: CORS })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const agent = await db.agent.findFirst({
    where: { widgetToken: token, isPublished: true },
    include: { owner: true, agentTools: true },
  })
  if (!agent) return new NextResponse("Agent not found", { status: 404, headers: CORS })
  if (!agent.owner.openaiApiKey) {
    return NextResponse.json(
      { error: "This agent is not fully configured." },
      { status: 400, headers: CORS }
    )
  }

  const { message, threadId } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required." }, { status: 400, headers: CORS })
  }

  const client = new OpenAI({ apiKey: agent.owner.openaiApiKey })
  const result = await runChat(client, agent.openaiAssistantId!, message, agent.agentTools, threadId)

  const existing = await db.conversation.findFirst({ where: { openaiThreadId: result.threadId } })
  if (!existing) {
    await db.conversation.create({ data: { agentId: agent.id, openaiThreadId: result.threadId } })
  }

  return NextResponse.json(result, { headers: CORS })
}

import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"
import OpenAI from "openai"

const PLAN_LIMITS: Record<string, number | null> = {
  free: 1,
  starter: 5,
  pro: 12,
  agency: null,
}

export async function GET() {
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const agents = await db.agent.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(agents)
}

export async function POST(req: Request) {
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const plan = user.plan || "free"
  const limit = PLAN_LIMITS[plan]

  if (limit !== null) {
    const count = await db.agent.count({ where: { ownerId: user.id } })
    if (count >= limit) {
      return NextResponse.json(
        {
          error: `PLAN_LIMIT: You've reached the ${plan} plan limit of ${limit} agent${
            limit !== 1 ? "s" : ""
          }. Please upgrade.`,
        },
        { status: 403 }
      )
    }
  }

  if (!user.openaiApiKey) {
    return NextResponse.json(
      { error: "NO_API_KEY: No OpenAI API key found. Please add your API key in Settings." },
      { status: 400 }
    )
  }

  const { name, description, systemPrompt, model } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: "Agent name is required." }, { status: 400 })
  }

  const client = new OpenAI({ apiKey: user.openaiApiKey })

  const assistant = await client.beta.assistants.create({
    name,
    instructions: systemPrompt || "You are a helpful assistant.",
    model: model || "gpt-4o-mini",
    tools: [{ type: "file_search" }],
  })

  const vectorStore = await client.vectorStores.create({
    name: `${name} Knowledge Base`,
  })

  await client.beta.assistants.update(assistant.id, {
    tool_resources: {
      file_search: { vector_store_ids: [vectorStore.id] },
    },
  })

  const agent = await db.agent.create({
    data: {
      name,
      description,
      systemPrompt,
      model: model || "gpt-4o-mini",
      openaiAssistantId: assistant.id,
      openaiVectorStoreId: vectorStore.id,
      ownerId: user.id,
    },
  })

  return NextResponse.json(agent)
}

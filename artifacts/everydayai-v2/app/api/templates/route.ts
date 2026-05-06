import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"
import OpenAI from "openai"
import { SYSTEM_TEMPLATES } from "@/lib/system-templates"

const PLAN_LIMITS: Record<string, number | null> = {
  free: 1,
  starter: 5,
  pro: 12,
  agency: null,
}

export async function GET() {
  const user = await ensureUser()

  const communityTemplates = await db.agent.findMany({
    where: { isTemplate: true },
    select: {
      id: true,
      name: true,
      description: true,
      model: true,
      systemPrompt: true,
      templateCategory: true,
      ownerId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    system: SYSTEM_TEMPLATES,
    community: communityTemplates,
    currentUserId: user?.id ?? null,
  })
}

export async function POST(req: Request) {
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  if (!user.openaiApiKey) {
    return NextResponse.json(
      { error: "NO_API_KEY: Add your OpenAI API key in Settings before using a template." },
      { status: 400 }
    )
  }

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

  const { templateId, isSystem } = await req.json()

  let name: string
  let description: string | null
  let systemPrompt: string | null
  let model: string
  let templateCategory: string | null = null

  if (isSystem) {
    const tpl = SYSTEM_TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return NextResponse.json({ error: "Template not found." }, { status: 404 })
    name = tpl.name
    description = tpl.description
    systemPrompt = tpl.systemPrompt
    model = tpl.model
    templateCategory = tpl.category
  } else {
    const tpl = await db.agent.findFirst({
      where: { id: Number(templateId), isTemplate: true },
    })
    if (!tpl) return NextResponse.json({ error: "Template not found." }, { status: 404 })
    name = tpl.name
    description = tpl.description
    systemPrompt = tpl.systemPrompt
    model = tpl.model
    templateCategory = tpl.templateCategory
  }

  const client = new OpenAI({ apiKey: user.openaiApiKey })

  const assistant = await client.beta.assistants.create({
    name,
    instructions: systemPrompt || "You are a helpful assistant.",
    model,
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
      model,
      openaiAssistantId: assistant.id,
      openaiVectorStoreId: vectorStore.id,
      templateCategory,
      ownerId: user.id,
    },
  })

  return NextResponse.json(agent)
}

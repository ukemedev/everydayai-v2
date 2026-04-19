import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import { db } from "@/lib/db"

const PLAN_LIMITS: Record<string, number | null> = {
  free: 1,
  starter: 5,
  pro: 12,
  agency: null,
}

export async function GET() {
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const agents = await db.agent.findMany({ where: { ownerId: user.id } })
  const plan = user.plan || "free"
  const totalAgents = agents.length
  const publishedAgents = agents.filter((a) => a.isPublished).length

  return NextResponse.json({
    email: user.email,
    plan,
    agentLimit: PLAN_LIMITS[plan],
    totalAgents,
    publishedAgents,
    hasOpenaiKey: !!user.openaiApiKey,
  })
}

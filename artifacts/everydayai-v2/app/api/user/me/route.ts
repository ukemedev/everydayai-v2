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

  const agentCount = await db.agent.count({ where: { ownerId: user.id } })
  const plan = user.plan || "free"

  return NextResponse.json({
    email: user.email,
    plan,
    agentCount,
    agentLimit: PLAN_LIMITS[plan],
    hasOpenaiKey: !!user.openaiApiKey,
  })
}

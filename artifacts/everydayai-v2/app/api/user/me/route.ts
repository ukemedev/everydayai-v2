import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const PLAN_LIMITS: Record<string, number | null> = {
  free: 1, starter: 5, pro: 12, agency: null,
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse("User not found", { status: 404 })

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

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const PLAN_LIMITS: Record<string, number | null> = {
  free: 1, starter: 5, pro: 12, agency: null,
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { agents: true }
  })

  if (!user) return new NextResponse("User not found", { status: 404 })

  const plan = user.plan || "free"
  const totalAgents = user.agents.length
  const publishedAgents = user.agents.filter((a: any) => a.isPublished).length

  return NextResponse.json({
    email: user.email,
    plan,
    agentLimit: PLAN_LIMITS[plan],
    totalAgents,
    publishedAgents,
    hasOpenaiKey: !!user.openaiApiKey,
  })
}

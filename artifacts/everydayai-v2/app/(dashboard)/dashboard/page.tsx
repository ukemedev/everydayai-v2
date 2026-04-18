import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

const PLAN_LIMITS: Record<string, number | null> = {
  free: 1, starter: 5, pro: 12, agency: null,
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { agents: true }
  })

  if (!user) redirect("/sign-in")

  const plan = user.plan || "free"
  const agentLimit = PLAN_LIMITS[plan]
  const publishedAgents = user.agents.filter(a => a.isPublished).length
  const totalAgents = user.agents.length

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "var(--orange-500)" }}>//</span>
        dashboard
        <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
      </div>

      <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--white)", marginBottom: "4px" }}>
        Welcome back
      </h1>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "28px" }}>
        {user.email}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <div style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>total agents</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "36px", fontWeight: 700, color: "var(--white)", lineHeight: 1, marginBottom: "6px" }}>{totalAgents}</div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>of {agentLimit ?? "∞"} on {plan}</div>
        </div>

        <div style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "18px 20px" }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>live agents</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "36px", fontWeight: 700, color: "var(--green-term)", lineHeight: 1, marginBottom: "6px" }}>{publishedAgents}</div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>deployed to websites</div>
        </div>

        <div style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "18px 20px" }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>current plan</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "36px", fontWeight: 700, color: "var(--orange-500)", lineHeight: 1, marginBottom: "6px", textTransform: "uppercase" }}>{plan}</div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>active subscription</div>
        </div>
      </div>

      <div style={{ background: "var(--surface-1)", border: "var(--border)", borderLeft: "2px solid var(--orange-500)", borderRadius: "var(--radius-md)", padding: "20px" }}>
        <div style={{ fontSize: "10px", color: "var(--orange-400)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
          // quick start
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: !user.openaiApiKey ? "var(--red)" : "var(--green-term)" }}>
              {!user.openaiApiKey ? "✗" : "✓"}
            </span>
            {!user.openaiApiKey ? "Add your OpenAI API key in Settings" : "OpenAI API key configured"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: totalAgents === 0 ? "var(--orange-400)" : "var(--green-term)" }}>
              {totalAgents === 0 ? "›" : "✓"}
            </span>
            {totalAgents === 0 ? "Create your first agent" : `${totalAgents} agent${totalAgents !== 1 ? "s" : ""} created`}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: publishedAgents === 0 ? "var(--orange-400)" : "var(--green-term)" }}>
              {publishedAgents === 0 ? "›" : "✓"}
            </span>
            {publishedAgents === 0 ? "Publish an agent and deploy to a website" : `${publishedAgents} agent${publishedAgents !== 1 ? "s" : ""} live`}
          </div>
        </div>
      </div>
    </div>
  )
}

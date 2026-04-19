"use client"

import { useState, useEffect } from "react"
import axios from "axios"

interface DashboardData {
  email: string
  plan: string
  agentLimit: number | null
  totalAgents: number
  publishedAgents: number
  hasOpenaiKey: boolean
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get("/api/dashboard")
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: "28px", fontSize: "12px", color: "var(--text-muted)" }}>
      // loading...
    </div>
  )

  if (!data) return (
    <div style={{ padding: "28px", fontSize: "12px", color: "var(--red)" }}>
      // error loading dashboard
    </div>
  )

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
        {data.email}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <div style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "18px 20px" }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>total agents</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "36px", fontWeight: 700, color: "var(--white)", lineHeight: 1, marginBottom: "6px" }}>{data.totalAgents}</div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>of {data.agentLimit ?? "∞"} on {data.plan}</div>
        </div>

        <div style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "18px 20px" }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>live agents</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "36px", fontWeight: 700, color: "var(--green-term)", lineHeight: 1, marginBottom: "6px" }}>{data.publishedAgents}</div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>deployed</div>
        </div>

        <div style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "18px 20px" }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>plan</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "36px", fontWeight: 700, color: "var(--orange-500)", lineHeight: 1, marginBottom: "6px", textTransform: "uppercase" }}>{data.plan}</div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>active</div>
        </div>
      </div>

      <div style={{ background: "var(--surface-1)", border: "var(--border)", borderLeft: "2px solid var(--orange-500)", borderRadius: "var(--radius-md)", padding: "20px" }}>
        <div style={{ fontSize: "10px", color: "var(--orange-400)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
          // quick start
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: !data.hasOpenaiKey ? "var(--red)" : "var(--green-term)" }}>
              {!data.hasOpenaiKey ? "✗" : "✓"}
            </span>
            {!data.hasOpenaiKey ? "Add your OpenAI API key in Settings" : "OpenAI API key configured"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: data.totalAgents === 0 ? "var(--orange-400)" : "var(--green-term)" }}>
              {data.totalAgents === 0 ? "›" : "✓"}
            </span>
            {data.totalAgents === 0 ? "Create your first agent" : `${data.totalAgents} agent${data.totalAgents !== 1 ? "s" : ""} created`}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: data.publishedAgents === 0 ? "var(--orange-400)" : "var(--green-term)" }}>
              {data.publishedAgents === 0 ? "›" : "✓"}
            </span>
            {data.publishedAgents === 0 ? "Publish an agent and deploy to a website" : `${data.publishedAgents} agent${data.publishedAgents !== 1 ? "s" : ""} live`}
          </div>
        </div>
      </div>
    </div>
  )
}

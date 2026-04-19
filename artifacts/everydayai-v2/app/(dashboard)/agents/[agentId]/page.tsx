"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"

interface Agent {
  id: number
  name: string
  description: string | null
  model: string
  systemPrompt: string | null
  isPublished: boolean
  widgetToken: string | null
}

export default function AgentStudioPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params?.agentId as string
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!agentId) return
    axios.get(`/api/agents/${agentId}`)
      .then((res) => setAgent(res.data))
      .catch(() => setError("Agent not found."))
      .finally(() => setLoading(false))
  }, [agentId])

  if (loading) {
    return (
      <div style={{ padding: "28px", fontSize: "12px", color: "var(--text-muted)" }}>
        // loading studio...
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div style={{ padding: "28px" }}>
        <div style={{ fontSize: "12px", color: "var(--red)", marginBottom: "16px" }}>{error || "Agent not found."}</div>
        <button onClick={() => router.push("/agents")} style={btnOutline}>← back to agents</button>
      </div>
    )
  }

  return (
    <div style={{ padding: "28px", maxWidth: "1100px" }}>
      {/* Breadcrumb */}
      <button
        onClick={() => router.push("/agents")}
        style={{ background: "none", border: "none", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer", marginBottom: "20px", padding: 0 }}
      >
        ← agents
      </button>

      {/* Agent header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "26px", fontWeight: 700, color: "var(--white)" }}>
              {agent.name}
            </h1>
            <span style={{
              fontSize: "9px", padding: "3px 8px", borderRadius: "var(--radius)",
              background: agent.isPublished ? "rgba(0,255,136,0.06)" : "rgba(255,85,0,0.06)",
              color: agent.isPublished ? "var(--green-term)" : "var(--orange-400)",
              border: `1px solid ${agent.isPublished ? "rgba(0,255,136,0.2)" : "rgba(255,85,0,0.2)"}`,
            }}>
              {agent.isPublished ? "● live" : "○ draft"}
            </span>
          </div>
          {agent.description && (
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{agent.description}</p>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
          <button style={btnOutline}>Deploy</button>
          <button style={btnOutline}>Share</button>
          <button style={btnOutline}>Version History</button>
        </div>
      </div>

      {/* Coming soon placeholder */}
      <div style={{
        background: "var(--surface-1)", border: "var(--border)",
        borderLeft: "2px solid var(--orange-500)", borderRadius: "var(--radius-md)",
        padding: "32px", textAlign: "center",
      }}>
        <div style={{ fontSize: "32px", marginBottom: "14px" }}>🛠</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 600, color: "var(--white)", marginBottom: "8px" }}>
          Agent Studio
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7 }}>
          // Prompt · Knowledge · Tools · Live Chat<br />
          Building now — coming in Phase 2
        </div>
        <div style={{ marginTop: "20px", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={statChip}>Model: {agent.model}</div>
          <div style={statChip}>ID: {agent.id}</div>
          <div style={statChip}>Status: {agent.isPublished ? "live" : "draft"}</div>
        </div>
      </div>
    </div>
  )
}

const btnOutline: React.CSSProperties = {
  padding: "8px 16px", background: "transparent",
  color: "var(--text-secondary)", border: "1px solid var(--border-color)",
  borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "11px",
  cursor: "pointer",
}

const statChip: React.CSSProperties = {
  padding: "5px 12px", background: "var(--surface-2)", border: "var(--border)",
  borderRadius: "var(--radius)", fontSize: "10px", color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
}

"use client"

import { useState, useEffect } from "react"
import axios from "axios"

interface Agent {
  id: number
  name: string
  description: string | null
  model: string
  isPublished: boolean
  widgetToken: string | null
  createdAt: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", systemPrompt: "", model: "gpt-4o-mini" })
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => { fetchAgents() }, [])

  async function fetchAgents() {
    try {
      const res = await axios.get("/api/agents")
      setAgents(res.data)
    } catch {
      setError("Failed to load agents")
    } finally {
      setLoading(false)
    }
  }

  async function createAgent() {
    if (!form.name.trim()) return
    setCreating(true)
    setError("")
    try {
      await axios.post("/api/agents", form)
      setForm({ name: "", description: "", systemPrompt: "", model: "gpt-4o-mini" })
      setShowForm(false)
      await fetchAgents()
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to create agent")
    } finally {
      setCreating(false)
    }
  }

  async function publishAgent(id: number) {
    try {
      await axios.post(`/api/agents/${id}/publish`)
      await fetchAgents()
    } catch {
      setError("Failed to publish agent")
    }
  }

  async function deleteAgent(id: number) {
    if (!confirm("Delete this agent?")) return
    try {
      await axios.delete(`/api/agents/${id}`)
      await fetchAgents()
    } catch {
      setError("Failed to delete agent")
    }
  }

  function copyEmbed(agent: Agent) {
    const appUrl = window.location.origin
    const code = `<script src="${appUrl}/widget.js" data-token="${agent.widgetToken}" data-url="${appUrl}"></script>`
    navigator.clipboard.writeText(code)
    setCopied(agent.id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "var(--orange-500)" }}>//</span>
        agents
        <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--white)", marginBottom: "4px" }}>Your Agents</h1>
          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{agents.length} agent{agents.length !== 1 ? "s" : ""} created</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "9px 18px", background: "var(--orange-500)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          {showForm ? "cancel" : "> new agent"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(255,51,51,0.08)", border: "1px solid rgba(255,51,51,0.25)", color: "var(--red)", padding: "10px 14px", fontSize: "11px", marginBottom: "18px", borderRadius: "var(--radius)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>// loading agents...</div>
      ) : agents.length === 0 ? (
        <div style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚡</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 600, color: "var(--white)", marginBottom: "6px" }}>No agents yet</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Create your first agent to get started</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {agents.map(agent => (
            <div key={agent.id} style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600, color: "var(--white)", marginBottom: "4px" }}>{agent.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{agent.model}</div>
                </div>
                <span style={{ fontSize: "9px", padding: "3px 8px", borderRadius: "var(--radius)", background: agent.isPublished ? "rgba(0,255,136,0.08)" : "rgba(255,85,0,0.08)", color: agent.isPublished ? "var(--green-term)" : "var(--orange-400)", border: `1px solid ${agent.isPublished ? "rgba(0,255,136,0.2)" : "rgba(255,85,0,0.2)"}` }}>
                  {agent.isPublished ? "live" : "draft"}
                </span>
              </div>
              {agent.description && (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.6 }}>{agent.description}</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {!agent.isPublished ? (
                  <button onClick={() => publishAgent(agent.id)} style={{ padding: "8px 14px", background: "rgba(0,255,136,0.08)", color: "var(--green-term)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer" }}>
                    ✓ publish agent
                  </button>
                ) : (
                  <button onClick={() => copyEmbed(agent)} style={{ padding: "8px 14px", background: "rgba(255,85,0,0.08)", color: "var(--orange-400)", border: "1px solid rgba(255,85,0,0.2)", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer" }}>
                    {copied === agent.id ? "✓ copied!" : "> copy embed code"}
                  </button>
                )}
                <button onClick={() => deleteAgent(agent.id)} style={{ padding: "8px 14px", background: "rgba(255,51,51,0.08)", color: "var(--red)", border: "1px solid rgba(255,51,51,0.25)", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer" }}>
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

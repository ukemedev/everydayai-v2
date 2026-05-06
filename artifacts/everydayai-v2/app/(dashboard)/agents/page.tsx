"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { TEMPLATE_CATEGORIES } from "@/lib/system-templates"

interface Agent {
  id: number
  name: string
  description: string | null
  model: string
  isPublished: boolean
  isTemplate: boolean
  widgetToken: string | null
  createdAt: string
}

const MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini", note: "fast & affordable" },
  { value: "gpt-4o", label: "GPT-4o", note: "most capable" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", note: "powerful" },
]

export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", systemPrompt: "", model: "gpt-4o-mini" })
  const [error, setError] = useState("")
  const [formError, setFormError] = useState("")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingTemplateId, setTogglingTemplateId] = useState<number | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchAgents() }, [])
  useEffect(() => { if (showModal) setTimeout(() => nameRef.current?.focus(), 50) }, [showModal])

  async function fetchAgents() {
    setLoading(true)
    setError("")
    try {
      const res = await axios.get("/api/agents")
      setAgents(res.data)
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to load agents. Please refresh.")
    } finally {
      setLoading(false)
    }
  }

  function openModal() {
    setForm({ name: "", description: "", systemPrompt: "", model: "gpt-4o-mini" })
    setFormError("")
    setShowModal(true)
  }

  function closeModal() {
    if (creating) return
    setShowModal(false)
    setFormError("")
  }

  async function createAgent() {
    if (!form.name.trim()) {
      setFormError("Agent name is required.")
      nameRef.current?.focus()
      return
    }
    setCreating(true)
    setFormError("")
    try {
      await axios.post("/api/agents", form)
      setShowModal(false)
      await fetchAgents()
    } catch (e: any) {
      const msg = e.response?.data?.error || "Failed to create agent."
      if (msg.startsWith("NO_API_KEY:")) {
        setFormError("No OpenAI API key found. Go to Settings and add your key first.")
      } else if (msg.startsWith("PLAN_LIMIT:")) {
        setFormError(msg.replace("PLAN_LIMIT: ", ""))
      } else {
        setFormError(msg)
      }
    } finally {
      setCreating(false)
    }
  }

  async function deleteAgent(id: number) {
    if (!confirm("Delete this agent? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await axios.delete(`/api/agents/${id}`)
      setAgents((prev) => prev.filter((a) => a.id !== id))
    } catch {
      setError("Failed to delete agent.")
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleTemplate(agent: Agent) {
    setTogglingTemplateId(agent.id)
    try {
      const res = await axios.post(`/api/agents/${agent.id}/template`, {
        templateCategory: "Support",
      })
      setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, isTemplate: res.data.isTemplate } : a))
    } catch {
      // ignore
    } finally {
      setTogglingTemplateId(null)
    }
  }

  return (
    <>
      <div style={{ padding: "28px", maxWidth: "960px" }}>
        <div style={{
          fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: "18px",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ color: "var(--orange-500)" }}>//</span>
          agents
          <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--white)", marginBottom: "4px" }}>
              Your Agents
            </h1>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {loading ? "loading..." : `${agents.length} agent${agents.length !== 1 ? "s" : ""} created`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/templates"
              style={{
                padding: "10px 16px", background: "var(--surface-2)", color: "var(--text-secondary)",
                border: "var(--border)", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)",
                fontSize: "11px", cursor: "pointer", textDecoration: "none", flexShrink: 0,
              }}
            >
              ⬡ browse templates
            </Link>
            <button
              onClick={openModal}
              style={{
                padding: "10px 20px", background: "var(--orange-500)", color: "#fff",
                border: "none", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)",
                fontSize: "12px", fontWeight: 700, cursor: "pointer", flexShrink: 0,
              }}
            >
              + new agent
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(255,51,51,0.06)", border: "1px solid rgba(255,51,51,0.25)",
            color: "var(--red)", padding: "10px 14px", fontSize: "11px",
            marginBottom: "20px", borderRadius: "var(--radius)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
          }}>
            <span>{error}</span>
            <button onClick={fetchAgents} style={{ fontSize: "10px", color: "var(--orange-400)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", flexShrink: 0 }}>
              retry
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "20px 0" }}>
            // loading agents...
          </div>
        ) : agents.length === 0 && !error ? (
          <div style={{
            background: "var(--surface-1)", border: "var(--border)",
            borderRadius: "var(--radius-md)", padding: "64px 32px", textAlign: "center",
          }}>
            <div style={{ fontSize: "36px", marginBottom: "14px" }}>⚡</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 600, color: "var(--white)", marginBottom: "8px" }}>
              No agents yet
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              Create from scratch or start from a template
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/templates"
                style={{
                  padding: "10px 20px", background: "var(--surface-2)", color: "var(--text-secondary)",
                  border: "var(--border)", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)",
                  fontSize: "11px", textDecoration: "none",
                }}
              >
                ⬡ browse templates
              </Link>
              <button
                onClick={openModal}
                style={{
                  padding: "10px 24px", background: "var(--orange-500)", color: "#fff",
                  border: "none", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)",
                  fontSize: "12px", fontWeight: 700, cursor: "pointer",
                }}
              >
                + create agent
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px" }}>
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                deleting={deletingId === agent.id}
                togglingTemplate={togglingTemplateId === agent.id}
                onDelete={() => deleteAgent(agent.id)}
                onToggleTemplate={() => toggleTemplate(agent)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      {showModal && (
        <div onClick={closeModal} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "var(--surface-1)", border: "var(--border)",
            borderRadius: "var(--radius-md)", width: "100%", maxWidth: "480px", padding: "28px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "9px", color: "var(--orange-500)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>
                  // new agent
                </div>
                <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--white)" }}>
                  Create a New Agent
                </h2>
              </div>
              <button onClick={closeModal} disabled={creating} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "18px", cursor: "pointer", padding: "4px" }}>
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Agent Name *</label>
                <input ref={nameRef} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && createAgent()} placeholder="e.g. Customer Support Bot" maxLength={80} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what this agent does" maxLength={160} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Model</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {MODELS.map((m) => (
                    <button key={m.value} onClick={() => setForm({ ...form, model: m.value })} style={{
                      padding: "8px 14px", borderRadius: "var(--radius)",
                      border: form.model === m.value ? "1px solid var(--orange-500)" : "1px solid var(--border-color)",
                      background: form.model === m.value ? "rgba(255,85,0,0.08)" : "var(--surface-2)",
                      color: form.model === m.value ? "var(--orange-400)" : "var(--text-secondary)",
                      fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer",
                    }}>
                      <span style={{ fontWeight: 700 }}>{m.label}</span>
                      <span style={{ color: "var(--text-muted)", marginLeft: "6px", fontSize: "9px" }}>{m.note}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <div style={{ background: "rgba(255,51,51,0.06)", border: "1px solid rgba(255,51,51,0.2)", color: "var(--red)", padding: "10px 12px", fontSize: "11px", borderRadius: "var(--radius)" }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                <button onClick={createAgent} disabled={creating} style={{
                  flex: 1, padding: "11px", background: creating ? "var(--surface-3)" : "var(--orange-500)",
                  color: "#fff", border: "none", borderRadius: "var(--radius)",
                  fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, cursor: creating ? "not-allowed" : "pointer",
                }}>
                  {creating ? "// creating..." : "> create agent"}
                </button>
                <button onClick={closeModal} disabled={creating} style={{
                  padding: "11px 20px", background: "transparent", color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)", borderRadius: "var(--radius)",
                  fontFamily: "var(--font-mono)", fontSize: "12px", cursor: creating ? "not-allowed" : "pointer",
                }}>
                  cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AgentCard({
  agent,
  deleting,
  togglingTemplate,
  onDelete,
  onToggleTemplate,
}: {
  agent: Agent
  deleting: boolean
  togglingTemplate: boolean
  onDelete: () => void
  onToggleTemplate: () => void
}) {
  return (
    <div style={{
      background: "var(--surface-1)", border: "var(--border)",
      borderRadius: "var(--radius-md)", padding: "20px",
      display: "flex", flexDirection: "column", gap: "14px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600,
            color: "var(--white)", marginBottom: "3px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {agent.name}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{agent.model}</div>
        </div>
        <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
          {agent.isTemplate && (
            <span style={{
              fontSize: "9px", padding: "3px 7px", borderRadius: "var(--radius)",
              background: "rgba(255,85,0,0.08)", color: "var(--orange-400)",
              border: "1px solid rgba(255,85,0,0.2)",
            }}>
              ⬡ template
            </span>
          )}
          <span style={{
            fontSize: "9px", padding: "3px 8px", borderRadius: "var(--radius)",
            background: agent.isPublished ? "rgba(0,255,136,0.06)" : "rgba(255,85,0,0.06)",
            color: agent.isPublished ? "var(--green-term)" : "var(--orange-400)",
            border: `1px solid ${agent.isPublished ? "rgba(0,255,136,0.2)" : "rgba(255,85,0,0.2)"}`,
          }}>
            {agent.isPublished ? "● live" : "○ draft"}
          </span>
        </div>
      </div>

      {agent.description && (
        <div style={{
          fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {agent.description}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto" }}>
        <Link href={`/agents/${agent.id}`} style={{
          display: "block", padding: "9px 14px", background: "var(--orange-500)",
          color: "#fff", border: "none", borderRadius: "var(--radius)",
          fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700,
          cursor: "pointer", textDecoration: "none", textAlign: "center",
        }}>
          ▶ open studio
        </Link>
        <button
          onClick={onToggleTemplate}
          disabled={togglingTemplate}
          style={{
            padding: "8px 14px",
            background: agent.isTemplate ? "rgba(255,85,0,0.08)" : "transparent",
            color: agent.isTemplate ? "var(--orange-400)" : "var(--text-muted)",
            border: agent.isTemplate ? "1px solid rgba(255,85,0,0.2)" : "1px solid var(--border-color)",
            borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "11px",
            cursor: togglingTemplate ? "not-allowed" : "pointer",
          }}
        >
          {togglingTemplate ? "..." : agent.isTemplate ? "⬡ remove from templates" : "⬡ share as template"}
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          style={{
            padding: "8px 14px", background: "rgba(255,51,51,0.04)",
            color: deleting ? "var(--text-muted)" : "var(--red)",
            border: "1px solid rgba(255,51,51,0.15)", borderRadius: "var(--radius)",
            fontFamily: "var(--font-mono)", fontSize: "11px", cursor: deleting ? "not-allowed" : "pointer",
          }}
        >
          {deleting ? "// deleting..." : "delete"}
        </button>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase",
  letterSpacing: "0.1em", display: "block", marginBottom: "6px",
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "var(--surface-2)", border: "1px solid var(--border-color)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontFamily: "var(--font-mono)", fontSize: "12px", outline: "none",
}

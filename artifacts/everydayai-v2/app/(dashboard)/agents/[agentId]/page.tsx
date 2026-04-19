"use client"

import { useState, useEffect, useRef } from "react"
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
  createdAt: string
  updatedAt: string
}

interface KnowledgeFile {
  id: number
  filename: string
  openaiFileId: string | null
  createdAt: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
}

const MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
]

function promptScore(prompt: string): number {
  if (!prompt || prompt.trim().length === 0) return 0
  let score = 0
  const len = prompt.trim().length
  if (len > 50) score += 20
  if (len > 200) score += 15
  if (len > 500) score += 10
  if (len > 1000) score += 5
  if (/#\s*(role|task|context|notes|instructions)/i.test(prompt)) score += 20
  if (prompt.split("\n").length > 3) score += 10
  if (/you are/i.test(prompt)) score += 10
  if (/do not|never|always/i.test(prompt)) score += 10
  return Math.min(score, 99)
}

export default function AgentStudioPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params?.agentId as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"prompt" | "knowledge" | "tools">("prompt")

  // Prompt tab state
  const [systemPrompt, setSystemPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini")
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState("")
  const [threadId, setThreadId] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState("")
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  // Modals & panels
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)

  // Knowledge
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadAgent() }, [agentId])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, chatLoading])

  async function loadAgent() {
    if (!agentId) return
    setLoading(true)
    setError("")
    try {
      const [agentRes, filesRes] = await Promise.all([
        axios.get(`/api/agents/${agentId}`),
        axios.get(`/api/agents/${agentId}/files`),
      ])
      const a: Agent = agentRes.data
      setAgent(a)
      setSystemPrompt(a.systemPrompt || "")
      setSelectedModel(a.model || "gpt-4o-mini")
      setFiles(filesRes.data)
      setIsDirty(false)
    } catch {
      setError("Failed to load agent.")
    } finally {
      setLoading(false)
    }
  }

  async function savePrompt() {
    if (!agent) return
    setSaveStatus("saving")
    try {
      const res = await axios.put(`/api/agents/${agentId}`, {
        name: agent.name,
        description: agent.description,
        systemPrompt,
        model: selectedModel,
      })
      setAgent(res.data)
      setIsDirty(false)
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2500)
    } catch {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 2500)
    }
  }

  async function sendMessage() {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput("")
    setChatError("")
    setMessages((prev) => [...prev, { role: "user", content: msg }])
    setChatLoading(true)
    try {
      const res = await axios.post(`/api/chat/${agentId}`, { message: msg, threadId })
      setThreadId(res.data.threadId)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply, usage: res.data.usage },
      ])
    } catch (e: any) {
      const errMsg = e.response?.data?.error || "Failed to get response."
      setChatError(errMsg)
      setMessages((prev) => prev.slice(0, -1))
      setChatInput(msg)
    } finally {
      setChatLoading(false)
      setTimeout(() => chatInputRef.current?.focus(), 50)
    }
  }

  function newChat() {
    setMessages([])
    setThreadId(null)
    setChatError("")
    setTimeout(() => chatInputRef.current?.focus(), 50)
  }

  async function publishAgent() {
    if (!agent) return
    setPublishing(true)
    try {
      const res = await axios.post(`/api/agents/${agentId}/publish`)
      setAgent(res.data)
      setShowPublishModal(false)
    } catch {
      // ignore
    } finally {
      setPublishing(false)
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    setUploadError("")
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await axios.post(`/api/agents/${agentId}/files`, fd)
      setFiles((prev) => [res.data, ...prev])
    } catch (err: any) {
      setUploadError(err.response?.data?.error || "Upload failed.")
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function deleteFile(fileId: number) {
    setDeletingFileId(fileId)
    try {
      await axios.delete(`/api/agents/${agentId}/files/${fileId}`)
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
    } catch {
      // ignore
    } finally {
      setDeletingFileId(null)
    }
  }

  function copyShareLink() {
    if (!agent?.widgetToken) return
    navigator.clipboard.writeText(`${window.location.origin}/chat/${agent.widgetToken}`)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  if (loading) return (
    <div style={{ padding: "28px", fontSize: "12px", color: "var(--text-muted)" }}>
      // loading studio...
    </div>
  )

  if (error || !agent) return (
    <div style={{ padding: "28px" }}>
      <div style={{ fontSize: "12px", color: "var(--red)", marginBottom: "16px" }}>{error || "Agent not found."}</div>
      <button onClick={() => router.push("/agents")} style={btnOutline}>← back to agents</button>
    </div>
  )

  const score = promptScore(systemPrompt)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* ── Studio Header ── */}
      <div style={{
        padding: "14px 24px", borderBottom: "var(--border)",
        background: "var(--surface-0)", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
          <button onClick={() => router.push("/agents")} style={{
            background: "none", border: "none", color: "var(--text-muted)",
            fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer",
            padding: "4px 0", flexShrink: 0,
          }}>
            ← agents
          </button>
          <div style={{ width: "1px", height: "16px", background: "var(--surface-3)", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700,
              color: "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {agent.name}
            </div>
            {agent.description && (
              <div style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {agent.description}
              </div>
            )}
          </div>
          <StatusBadge isPublished={agent.isPublished} isDirty={isDirty} />
        </div>

        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          {!agent.isPublished && (
            <button onClick={() => setShowPublishModal(true)} style={btnOrange}>
              ▲ deploy
            </button>
          )}
          {agent.isPublished && (
            <button onClick={() => setShowSharePanel(!showSharePanel)} style={btnOutline}>
              ↗ share
            </button>
          )}
          <button onClick={() => setShowVersionModal(true)} style={btnOutline}>
            ⊞ versions
          </button>
        </div>
      </div>

      {/* ── Main Split Layout ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left Panel ── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", borderRight: "var(--border)" }}>

          {/* Tab bar */}
          <div style={{
            display: "flex", gap: "2px", padding: "12px 20px 0",
            borderBottom: "var(--border)", background: "var(--surface-0)", flexShrink: 0,
          }}>
            {(["prompt", "knowledge", "tools"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 18px", background: activeTab === tab ? "var(--surface-1)" : "transparent",
                  border: activeTab === tab ? "1px solid var(--border-color)" : "1px solid transparent",
                  borderBottom: activeTab === tab ? "1px solid var(--surface-1)" : "1px solid transparent",
                  borderRadius: "var(--radius) var(--radius) 0 0",
                  color: activeTab === tab ? "var(--white)" : "var(--text-muted)",
                  fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer",
                  marginBottom: "-1px", transition: "var(--transition)",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

            {/* ── PROMPT TAB ── */}
            {activeTab === "prompt" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {agent.isPublished && (
                  <div style={{
                    background: "var(--surface-2)", border: "1px solid rgba(0,255,136,0.15)",
                    borderRadius: "var(--radius-md)", padding: "20px",
                  }}>
                    <div style={{ fontSize: "20px", marginBottom: "8px" }}>🎉</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, color: "var(--white)", marginBottom: "6px" }}>
                      Your Agent is Published and Live
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px", lineHeight: 1.6 }}>
                      To make changes, edit below and save. Changes go live immediately.
                    </div>
                  </div>
                )}

                {/* Model */}
                <div>
                  <div style={fieldLabel}>Model</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {MODELS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => { setSelectedModel(m.value); setIsDirty(true) }}
                        style={{
                          padding: "7px 14px", borderRadius: "var(--radius)",
                          border: selectedModel === m.value ? "1px solid var(--orange-500)" : "1px solid var(--border-color)",
                          background: selectedModel === m.value ? "rgba(255,85,0,0.08)" : "var(--surface-2)",
                          color: selectedModel === m.value ? "var(--orange-400)" : "var(--text-secondary)",
                          fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer",
                          transition: "var(--transition)",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={fieldLabel}>Instructions</span>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: score >= 60 ? "rgba(255,85,0,0.15)" : "var(--surface-2)",
                      border: score >= 60 ? "1px solid rgba(255,85,0,0.4)" : "1px solid var(--border-color)",
                      fontSize: "10px", fontWeight: 700,
                      color: score >= 60 ? "var(--orange-400)" : "var(--text-muted)",
                    }}>
                      {score}
                    </div>
                  </div>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => { setSystemPrompt(e.target.value); setIsDirty(true) }}
                    placeholder={"# Role\nYou are a helpful assistant...\n\n# Task\nHelp users by...\n\n# Context\n..."}
                    style={{
                      width: "100%", minHeight: "260px", padding: "12px",
                      background: "var(--surface-2)", border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius)", color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: 1.7,
                      resize: "vertical", outline: "none",
                    }}
                  />
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {systemPrompt.length} characters · Use # Role, # Task, # Context headers for a better score
                  </div>
                </div>

                {/* Save button */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    onClick={savePrompt}
                    disabled={!isDirty || saveStatus === "saving"}
                    style={{
                      padding: "10px 24px",
                      background: isDirty ? "var(--orange-500)" : "var(--surface-2)",
                      color: isDirty ? "#fff" : "var(--text-muted)",
                      border: isDirty ? "none" : "1px solid var(--border-color)",
                      borderRadius: "var(--radius)", fontFamily: "var(--font-mono)",
                      fontSize: "12px", fontWeight: 700,
                      cursor: isDirty ? "pointer" : "not-allowed",
                      transition: "var(--transition)",
                    }}
                  >
                    {saveStatus === "saving" ? "// saving..." : saveStatus === "saved" ? "✓ saved" : saveStatus === "error" ? "✗ error" : "> save changes"}
                  </button>
                  {isDirty && (
                    <span style={{ fontSize: "10px", color: "var(--orange-400)" }}>
                      ● unsaved changes
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── KNOWLEDGE TAB ── */}
            {activeTab === "knowledge" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600, color: "var(--white)", marginBottom: "4px" }}>
                    Knowledge Base
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Upload documents your agent will use to answer questions. Supports PDF, TXT, DOCX.
                  </div>
                </div>

                {uploadError && (
                  <div style={{
                    background: "rgba(255,51,51,0.06)", border: "1px solid rgba(255,51,51,0.2)",
                    color: "var(--red)", padding: "10px 12px", fontSize: "11px", borderRadius: "var(--radius)",
                  }}>
                    {uploadError}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx,.md,.csv"
                  onChange={uploadFile}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  style={{
                    padding: "10px 20px", background: uploadingFile ? "var(--surface-2)" : "rgba(255,85,0,0.08)",
                    color: uploadingFile ? "var(--text-muted)" : "var(--orange-400)",
                    border: "1px solid rgba(255,85,0,0.25)", borderRadius: "var(--radius)",
                    fontFamily: "var(--font-mono)", fontSize: "12px", cursor: uploadingFile ? "not-allowed" : "pointer",
                    alignSelf: "flex-start",
                  }}
                >
                  {uploadingFile ? "// uploading..." : "+ upload document"}
                </button>

                {files.length === 0 ? (
                  <div style={{
                    background: "var(--surface-2)", border: "1px dashed var(--border-color)",
                    borderRadius: "var(--radius-md)", padding: "40px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "24px", marginBottom: "10px" }}>📄</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      No documents uploaded yet
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {files.map((file) => (
                      <div key={file.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", background: "var(--surface-2)", border: "var(--border)",
                        borderRadius: "var(--radius)", gap: "12px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <span style={{ fontSize: "14px", flexShrink: 0 }}>📄</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontSize: "12px", color: "var(--text-primary)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {file.filename}
                            </div>
                            <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {new Date(file.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteFile(file.id)}
                          disabled={deletingFileId === file.id}
                          style={{
                            background: "none", border: "none", color: "var(--text-muted)",
                            fontSize: "11px", cursor: "pointer", flexShrink: 0, padding: "4px",
                          }}
                        >
                          {deletingFileId === file.id ? "..." : "✕"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TOOLS TAB ── */}
            {activeTab === "tools" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600, color: "var(--white)", marginBottom: "4px" }}>
                    Tools
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Connect external APIs and webhooks your agent can call during conversations.
                  </div>
                </div>
                <div style={{
                  background: "var(--surface-2)", border: "1px dashed var(--border-color)",
                  borderRadius: "var(--radius-md)", padding: "48px", textAlign: "center",
                }}>
                  <div style={{ fontSize: "28px", marginBottom: "12px" }}>🔧</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--white)", marginBottom: "6px" }}>
                    Tools — Coming Soon
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.7 }}>
                    Connect Airtable, webhooks, and custom APIs<br />
                    using OpenAPI specifications.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel — Chat ── */}
        <div style={{
          width: "420px", flexShrink: 0, display: "flex", flexDirection: "column",
          background: "var(--surface-0)", position: "relative",
        }}>
          {/* Chat header */}
          <div style={{
            padding: "12px 16px", borderBottom: "var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
          }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
              // test your agent
            </div>
            <button onClick={newChat} style={{
              background: "none", border: "1px solid var(--border-color)",
              borderRadius: "var(--radius)", color: "var(--text-muted)",
              fontFamily: "var(--font-mono)", fontSize: "10px", padding: "4px 10px",
              cursor: "pointer",
            }}>
              new chat
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.length === 0 && !chatLoading && (
              <div style={{ textAlign: "center", paddingTop: "40px" }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>💬</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Start a conversation to test<br />your agent
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{ maxWidth: "85%" }}>
                  <div style={{
                    padding: "10px 13px", borderRadius: "var(--radius-md)",
                    background: msg.role === "user" ? "var(--orange-500)" : "var(--surface-2)",
                    color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                    fontSize: "12px", lineHeight: 1.65,
                    border: msg.role === "assistant" ? "var(--border)" : "none",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.usage && (
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px", paddingLeft: "2px" }}>
                      {msg.usage.total_tokens} tokens
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 16px", borderRadius: "var(--radius-md)",
                  background: "var(--surface-2)", border: "var(--border)",
                  fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.15em",
                }}>
                  thinking...
                </div>
              </div>
            )}

            {chatError && (
              <div style={{
                padding: "8px 12px", background: "rgba(255,51,51,0.06)",
                border: "1px solid rgba(255,51,51,0.2)", borderRadius: "var(--radius)",
                fontSize: "11px", color: "var(--red)",
              }}>
                {chatError}
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat input */}
          <div style={{ padding: "12px 14px", borderTop: "var(--border)", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Send a message..."
                rows={2}
                style={{
                  flex: 1, padding: "9px 12px", background: "var(--surface-2)",
                  border: "1px solid var(--border-color)", borderRadius: "var(--radius)",
                  color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "12px",
                  resize: "none", outline: "none", lineHeight: 1.5,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || chatLoading}
                style={{
                  padding: "10px 16px", background: chatInput.trim() && !chatLoading ? "var(--orange-500)" : "var(--surface-2)",
                  color: chatInput.trim() && !chatLoading ? "#fff" : "var(--text-muted)",
                  border: "none", borderRadius: "var(--radius)",
                  fontFamily: "var(--font-mono)", fontSize: "12px",
                  cursor: chatInput.trim() && !chatLoading ? "pointer" : "not-allowed",
                  flexShrink: 0, transition: "var(--transition)",
                }}
              >
                →
              </button>
            </div>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "5px" }}>
              Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>

      {/* ── Publish Modal ── */}
      {showPublishModal && (
        <div onClick={() => !publishing && setShowPublishModal(false)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "var(--surface-1)", border: "var(--border)",
            borderRadius: "var(--radius-md)", padding: "28px", width: "100%", maxWidth: "400px",
          }}>
            <div style={{ fontSize: "20px", marginBottom: "12px" }}>▲</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--white)", marginBottom: "8px" }}>
              Deploy Your Agent
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "20px" }}>
              Your agent will go <span style={{ color: "var(--green-term)" }}>● Live</span> and be accessible via its deploy link. You can make changes at any time.
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={publishAgent}
                disabled={publishing}
                style={{
                  flex: 1, padding: "11px", background: publishing ? "var(--surface-3)" : "var(--orange-500)",
                  color: "#fff", border: "none", borderRadius: "var(--radius)",
                  fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700,
                  cursor: publishing ? "not-allowed" : "pointer",
                }}
              >
                {publishing ? "// publishing..." : "Yes, go live"}
              </button>
              <button
                onClick={() => setShowPublishModal(false)}
                disabled={publishing}
                style={{
                  padding: "11px 20px", background: "transparent",
                  color: "var(--text-secondary)", border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share Panel ── */}
      {showSharePanel && (
        <div onClick={() => setShowSharePanel(false)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: "340px",
            background: "var(--surface-1)", borderLeft: "var(--border)",
            padding: "24px", display: "flex", flexDirection: "column", gap: "18px",
            zIndex: 1001,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, color: "var(--white)" }}>
                Share Agent
              </div>
              <button onClick={() => setShowSharePanel(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "16px", cursor: "pointer" }}>
                ✕
              </button>
            </div>

            <div>
              <div style={fieldLabel}>Agent Chat Link</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  readOnly
                  value={agent.widgetToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/chat/${agent.widgetToken}` : "Publish agent first"}
                  style={{ ...inputStyle, flex: 1, fontSize: "10px" }}
                />
                <button
                  onClick={copyShareLink}
                  disabled={!agent.widgetToken}
                  style={{
                    padding: "8px 12px", background: "var(--surface-2)",
                    border: "var(--border)", borderRadius: "var(--radius)",
                    color: shareCopied ? "var(--green-term)" : "var(--text-secondary)",
                    fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer", flexShrink: 0,
                  }}
                >
                  {shareCopied ? "✓" : "copy"}
                </button>
              </div>
              {!agent.widgetToken && (
                <div style={{ fontSize: "10px", color: "var(--orange-400)", marginTop: "6px" }}>
                  Deploy your agent first to get a share link.
                </div>
              )}
            </div>

            <div style={{ fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.7, padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius)" }}>
              Share this link to let anyone test your agent. Does not include API keys or conversation history.
            </div>
          </div>
        </div>
      )}

      {/* ── Version Modal ── */}
      {showVersionModal && (
        <div onClick={() => setShowVersionModal(false)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "var(--surface-1)", border: "var(--border)",
            borderRadius: "var(--radius-md)", padding: "28px", width: "100%", maxWidth: "440px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, color: "var(--white)" }}>
                Version History
              </div>
              <button onClick={() => setShowVersionModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "16px", cursor: "pointer" }}>
                ✕
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", background: "var(--surface-2)", border: "1px solid rgba(255,85,0,0.2)",
                borderRadius: "var(--radius)",
              }}>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--white)", marginBottom: "3px" }}>
                    Current · {agent.model}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    Updated {new Date(agent.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <span style={{ fontSize: "9px", color: "var(--orange-400)", background: "rgba(255,85,0,0.08)", border: "1px solid rgba(255,85,0,0.2)", padding: "3px 8px", borderRadius: "var(--radius)" }}>
                  current
                </span>
              </div>
              <div style={{
                padding: "12px 14px", background: "var(--surface-2)", border: "var(--border)",
                borderRadius: "var(--radius)",
              }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "3px" }}>
                  v1 · Created
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  {new Date(agent.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ isPublished, isDirty }: { isPublished: boolean; isDirty: boolean }) {
  if (isDirty && isPublished) return (
    <span style={{ fontSize: "9px", padding: "3px 8px", borderRadius: "var(--radius)", background: "rgba(255,85,0,0.08)", color: "var(--orange-400)", border: "1px solid rgba(255,85,0,0.2)", flexShrink: 0 }}>
      ● edited
    </span>
  )
  if (isPublished) return (
    <span style={{ fontSize: "9px", padding: "3px 8px", borderRadius: "var(--radius)", background: "rgba(0,255,136,0.06)", color: "var(--green-term)", border: "1px solid rgba(0,255,136,0.2)", flexShrink: 0 }}>
      ● live
    </span>
  )
  return (
    <span style={{ fontSize: "9px", padding: "3px 8px", borderRadius: "var(--radius)", background: "rgba(255,85,0,0.06)", color: "var(--orange-400)", border: "1px solid rgba(255,85,0,0.2)", flexShrink: 0 }}>
      ○ draft
    </span>
  )
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
  zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
}

const fieldLabel: React.CSSProperties = {
  fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase",
  letterSpacing: "0.1em", display: "block", marginBottom: "8px",
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", background: "var(--surface-2)",
  border: "1px solid var(--border-color)", borderRadius: "var(--radius)",
  color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "12px", outline: "none",
}

const btnOrange: React.CSSProperties = {
  padding: "8px 16px", background: "var(--orange-500)", color: "#fff",
  border: "none", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)",
  fontSize: "11px", fontWeight: 700, cursor: "pointer",
}

const btnOutline: React.CSSProperties = {
  padding: "8px 14px", background: "transparent", color: "var(--text-secondary)",
  border: "1px solid var(--border-color)", borderRadius: "var(--radius)",
  fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer",
}

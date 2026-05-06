"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import axios from "axios"

interface Agent {
  id: number
  name: string
  model: string
}

interface KnowledgeFile {
  id: number
  filename: string
  createdAt: string
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return "📕"
  if (ext === "docx" || ext === "doc") return "📘"
  if (ext === "txt") return "📝"
  if (ext === "csv") return "📊"
  if (ext === "md") return "📄"
  return "📄"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function KnowledgePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchAgents() }, [])

  useEffect(() => {
    if (selectedId !== null) fetchFiles(selectedId)
  }, [selectedId])

  async function fetchAgents() {
    setLoadingAgents(true)
    try {
      const res = await axios.get("/api/agents")
      setAgents(res.data)
      if (res.data.length > 0) setSelectedId(res.data[0].id)
    } catch {
      setError("Failed to load agents.")
    } finally {
      setLoadingAgents(false)
    }
  }

  async function fetchFiles(agentId: number) {
    setLoadingFiles(true)
    setError("")
    try {
      const res = await axios.get(`/api/agents/${agentId}/files`)
      setFiles(res.data)
    } catch {
      setError("Failed to load files.")
    } finally {
      setLoadingFiles(false)
    }
  }

  async function uploadFile(file: File) {
    if (!selectedId) return
    setUploading(true)
    setError("")
    setSuccess("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      await axios.post(`/api/agents/${selectedId}/files`, formData)
      setSuccess(`✓ "${file.name}" uploaded successfully.`)
      await fetchFiles(selectedId)
      setTimeout(() => setSuccess(""), 4000)
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to upload file.")
    } finally {
      setUploading(false)
    }
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ""
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [selectedId])

  async function deleteFile(fileId: number) {
    if (!confirm("Delete this file from the knowledge base?")) return
    if (!selectedId) return
    setDeletingId(fileId)
    try {
      await axios.delete(`/api/agents/${selectedId}/files/${fileId}`)
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
    } catch {
      setError("Failed to delete file.")
    } finally {
      setDeletingId(null)
    }
  }

  const selectedAgent = agents.find((a) => a.id === selectedId)

  if (loadingAgents) {
    return (
      <div style={{ padding: "28px" }}>
        <Breadcrumb />
        <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "20px 0" }}>
          // loading...
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div style={{ padding: "28px", maxWidth: "600px" }}>
        <Breadcrumb />
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--white)", marginBottom: "24px" }}>
          Knowledge Base
        </h1>
        <div style={{
          background: "var(--surface-1)", border: "var(--border)",
          borderRadius: "var(--radius-md)", padding: "60px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "14px" }}>📚</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 600, color: "var(--white)", marginBottom: "8px" }}>
            No agents yet
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
            Create an agent first, then upload knowledge documents to train it.
          </div>
          <Link href="/agents" style={{
            display: "inline-block", padding: "10px 24px", background: "var(--orange-500)",
            color: "#fff", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)",
            fontSize: "12px", fontWeight: 700, textDecoration: "none",
          }}>
            → create your first agent
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: "28px" }}>
      <Breadcrumb />

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--white)", marginBottom: "4px" }}>
          Knowledge Base
        </h1>
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Upload documents to train your agents. Supports PDF, DOCX, TXT, CSV, and Markdown.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* ── Left: Agent list ── */}
        <div style={{
          width: "220px", flexShrink: 0,
          background: "var(--surface-1)", border: "var(--border)",
          borderRadius: "var(--radius-md)", overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 14px", borderBottom: "var(--border)",
            fontSize: "9px", color: "var(--text-muted)",
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            // agents ({agents.length})
          </div>
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedId(agent.id)}
              style={{
                width: "100%", padding: "12px 14px", background: "none", border: "none",
                borderBottom: "var(--border)", textAlign: "left", cursor: "pointer",
                display: "flex", flexDirection: "column", gap: "3px",
                background: selectedId === agent.id ? "rgba(255,85,0,0.06)" : "transparent",
                borderLeft: selectedId === agent.id ? "2px solid var(--orange-500)" : "2px solid transparent",
                transition: "var(--transition)",
              } as React.CSSProperties}
            >
              <span style={{
                fontSize: "12px",
                color: selectedId === agent.id ? "var(--white)" : "var(--text-secondary)",
                fontFamily: "var(--font-mono)", fontWeight: selectedId === agent.id ? 700 : 400,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                display: "block", maxWidth: "170px",
              }}>
                {agent.name}
              </span>
              <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{agent.model}</span>
            </button>
          ))}
        </div>

        {/* ── Right: Files panel ── */}
        <div style={{ flex: 1, minWidth: "280px" }}>

          {/* Agent name header */}
          <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, color: "var(--white)" }}>
                {selectedAgent?.name}
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "10px" }}>
                {loadingFiles ? "loading..." : `${files.length} file${files.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <Link
              href={`/agents/${selectedId}`}
              style={{
                fontSize: "10px", color: "var(--orange-400)", textDecoration: "none",
                fontFamily: "var(--font-mono)",
              }}
            >
              open studio →
            </Link>
          </div>

          {/* Alerts */}
          {error && (
            <div style={{ background: "rgba(255,51,51,0.06)", border: "1px solid rgba(255,51,51,0.25)", color: "var(--red)", padding: "10px 14px", fontSize: "11px", marginBottom: "14px", borderRadius: "var(--radius)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "14px" }}>✕</button>
            </div>
          )}
          {success && (
            <div style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.25)", color: "var(--green-term)", padding: "10px 14px", fontSize: "11px", marginBottom: "14px", borderRadius: "var(--radius)" }}>
              {success}
            </div>
          )}

          {/* Upload drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              padding: "28px 20px", marginBottom: "16px",
              border: dragging ? "1px solid var(--orange-500)" : "1px dashed var(--border-color)",
              borderRadius: "var(--radius-md)", textAlign: "center",
              background: dragging ? "rgba(255,85,0,0.04)" : "var(--surface-1)",
              cursor: uploading ? "not-allowed" : "pointer",
              transition: "var(--transition)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>
              {uploading ? "⏳" : dragging ? "⬇️" : "📎"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
              {uploading ? "// uploading..." : dragging ? "Drop to upload" : "Drag & drop a file, or click to browse"}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              PDF, DOCX, TXT, CSV, MD — max 20 MB
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx,.doc,.csv,.md"
              onChange={onFileInput}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </div>

          {/* File list */}
          <div style={{
            background: "var(--surface-1)", border: "var(--border)",
            borderRadius: "var(--radius-md)", overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px", borderBottom: "var(--border)",
              fontSize: "9px", color: "var(--text-muted)",
              letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              // uploaded files
            </div>

            {loadingFiles ? (
              <div style={{ padding: "32px", textAlign: "center", fontSize: "11px", color: "var(--text-muted)" }}>
                // loading files...
              </div>
            ) : files.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>🗂</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  No files yet — upload a document above to get started.
                </div>
              </div>
            ) : (
              files.map((file, i) => (
                <div
                  key={file.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "13px 16px",
                    borderBottom: i < files.length - 1 ? "var(--border)" : "none",
                    transition: "var(--transition)",
                  }}
                >
                  <span style={{ fontSize: "18px", flexShrink: 0 }}>{fileIcon(file.filename)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "12px", color: "var(--text-primary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontFamily: "var(--font-mono)",
                    }}>
                      {file.filename}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Uploaded {formatDate(file.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFile(file.id)}
                    disabled={deletingId === file.id}
                    style={{
                      padding: "5px 12px", flexShrink: 0,
                      background: "rgba(255,51,51,0.06)",
                      color: deletingId === file.id ? "var(--text-muted)" : "var(--red)",
                      border: "1px solid rgba(255,51,51,0.2)", borderRadius: "var(--radius)",
                      fontFamily: "var(--font-mono)", fontSize: "10px",
                      cursor: deletingId === file.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {deletingId === file.id ? "..." : "delete"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Breadcrumb() {
  return (
    <div style={{
      fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em",
      textTransform: "uppercase", marginBottom: "18px",
      display: "flex", alignItems: "center", gap: "8px",
    }}>
      <span style={{ color: "var(--orange-500)" }}>//</span>
      knowledge base
      <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
    </div>
  )
}

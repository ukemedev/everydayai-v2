"use client"

import { useState, useEffect } from "react"
import axios from "axios"

interface Agent {
  id: number
  name: string
}

interface KnowledgeFile {
  id: number
  filename: string
  createdAt: string
}

export default function KnowledgePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => { fetchAgents() }, [])
  useEffect(() => { if (selectedAgent) fetchFiles(selectedAgent) }, [selectedAgent])

  async function fetchAgents() {
    try {
      const res = await axios.get("/api/agents")
      setAgents(res.data)
      if (res.data.length > 0) setSelectedAgent(res.data[0].id)
    } catch {
      setError("Failed to load agents")
    }
  }

  async function fetchFiles(agentId: number) {
    setLoading(true)
    try {
      const res = await axios.get(`/api/agents/${agentId}/files`)
      setFiles(res.data)
    } catch {
      setError("Failed to load files")
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedAgent) return
    setUploading(true)
    setError("")
    setSuccess("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      await axios.post(`/api/agents/${selectedAgent}/files`, formData)
      setSuccess("✓ File uploaded successfully")
      await fetchFiles(selectedAgent)
      setTimeout(() => setSuccess(""), 3000)
    } catch {
      setError("Failed to upload file")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function deleteFile(fileId: number) {
    if (!confirm("Delete this file?")) return
    if (!selectedAgent) return
    try {
      await axios.delete(`/api/agents/${selectedAgent}/files/${fileId}`)
      await fetchFiles(selectedAgent)
    } catch {
      setError("Failed to delete file")
    }
  }

  return (
    <div style={{ padding: "28px", maxWidth: "700px" }}>
      <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "var(--orange-500)" }}>//</span>
        knowledge base
        <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
      </div>

      <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--white)", marginBottom: "6px" }}>
        Knowledge Base
      </h1>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "24px" }}>
        Upload documents to train your agents
      </p>

      {agents.length === 0 ? (
        <div style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📚</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 600, color: "var(--white)", marginBottom: "6px" }}>No agents yet</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Create an agent first before uploading knowledge files</div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "10px", color: "var(--orange-400)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
              select agent
            </label>
            <select
              value={selectedAgent || ""}
              onChange={e => setSelectedAgent(Number(e.target.value))}
              style={{ width: "100%", padding: "10px 14px", background: "var(--surface-0)", border: "var(--border)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "13px", outline: "none", borderRadius: "var(--radius)", cursor: "pointer" }}
            >
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ background: "rgba(255,51,51,0.08)", border: "1px solid rgba(255,51,51,0.25)", color: "var(--red)", padding: "10px 14px", fontSize: "11px", marginBottom: "14px", borderRadius: "var(--radius)" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", color: "var(--green-term)", padding: "10px 14px", fontSize: "11px", marginBottom: "14px", borderRadius: "var(--radius)" }}>
              {success}
            </div>
          )}

          <div style={{ background: "var(--surface-1)", border: "var(--border)", borderLeft: "2px solid var(--orange-500)", borderRadius: "var(--radius-md)", padding: "20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "10px", color: "var(--orange-400)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
              // upload document
            </div>
            <label style={{ display: "block", padding: "20px", border: "1px dashed var(--surface-3)", borderRadius: "var(--radius)", textAlign: "center", cursor: "pointer", transition: "var(--transition)" }}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📄</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                {uploading ? "// uploading..." : "Click to upload PDF, TXT, or DOCX"}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Max 20MB</div>
              <input type="file" accept=".pdf,.txt,.docx" onChange={uploadFile} disabled={uploading} style={{ display: "none" }} />
            </label>
          </div>

          <div style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "20px" }}>
            <div style={{ fontSize: "10px", color: "var(--orange-400)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
              // uploaded files ({files.length})
            </div>
            {loading ? (
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>// loading files...</div>
            ) : files.length === 0 ? (
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
                No files uploaded yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {files.map(file => (
                  <div key={file.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--surface-0)", border: "var(--border)", borderRadius: "var(--radius)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "var(--orange-400)", fontSize: "14px" }}>📄</span>
                      <div>
                        <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>{file.filename}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {new Date(file.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteFile(file.id)} style={{ padding: "6px 12px", background: "rgba(255,51,51,0.08)", color: "var(--red)", border: "1px solid rgba(255,51,51,0.25)", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "10px", cursor: "pointer" }}>
                      delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

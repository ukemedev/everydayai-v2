"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"

interface AgentInfo {
  name: string
  description: string | null
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function PublicChatPage() {
  const params = useParams()
  const token = params?.token as string

  const [agent, setAgent] = useState<AgentInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [threadId, setThreadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    axios
      .get(`/api/widget/${token}`)
      .then((r) => setAgent(r.data))
      .catch(() => setNotFound(true))
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function send() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput("")
    setError("")
    setMessages((prev) => [...prev, { role: "user", content: msg }])
    setLoading(true)
    try {
      const res = await axios.post(`/api/widget/${token}`, { message: msg, threadId })
      setThreadId(res.data.threadId)
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }])
    } catch (e: any) {
      const errMsg = e.response?.data?.error || "Something went wrong. Please try again."
      setError(errMsg)
      setMessages((prev) => prev.slice(0, -1))
      setInput(msg)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  if (notFound) {
    return (
      <div style={page}>
        <div style={card}>
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🤖</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
              Agent not found
            </div>
            <div style={{ fontSize: "12px", color: "#555" }}>
              This link may be invalid or the agent has been unpublished.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div style={page}>
        <div style={{ fontSize: "11px", color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>
          // loading...
        </div>
      </div>
    )
  }

  return (
    <div style={page}>
      <div style={card}>
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #1a1a1a",
          display: "flex", alignItems: "center", gap: "14px", flexShrink: 0,
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "rgba(255,85,0,0.12)", border: "1px solid rgba(255,85,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", flexShrink: 0,
          }}>
            🤖
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px",
              fontWeight: 700, color: "#fff", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {agent.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#00ff88", display: "inline-block", flexShrink: 0,
              }} />
              <span style={{ fontSize: "10px", color: "#555" }}>Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "20px",
          display: "flex", flexDirection: "column", gap: "14px",
        }}>
          {messages.length === 0 && !loading && (
            <div style={{ textAlign: "center", paddingTop: "48px" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>👋</div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "15px", fontWeight: 600, color: "#e8e8e8", marginBottom: "6px",
              }}>
                Hi! I'm {agent.name}
              </div>
              {agent.description && (
                <div style={{ fontSize: "12px", color: "#555", lineHeight: 1.7, maxWidth: "280px", margin: "0 auto" }}>
                  {agent.description}
                </div>
              )}
              <div style={{ fontSize: "11px", color: "#333", marginTop: "20px" }}>
                Send a message to start chatting
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", marginRight: "8px", flexShrink: 0, alignSelf: "flex-end",
                }}>
                  🤖
                </div>
              )}
              <div style={{ maxWidth: "80%" }}>
                <div style={{
                  padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: msg.role === "user" ? "#ff5500" : "#1a1a1a",
                  color: msg.role === "user" ? "#fff" : "#e8e8e8",
                  fontSize: "13px", lineHeight: 1.65,
                  border: msg.role === "assistant" ? "1px solid #222" : "none",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  fontFamily: msg.role === "assistant" ? "'JetBrains Mono', monospace" : "inherit",
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px",
              }}>
                🤖
              </div>
              <div style={{
                padding: "10px 16px", borderRadius: "14px 14px 14px 4px",
                background: "#1a1a1a", border: "1px solid #222",
                fontSize: "11px", color: "#555", fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.15em",
              }}>
                thinking...
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: "10px 14px", background: "rgba(255,51,51,0.06)",
              border: "1px solid rgba(255,51,51,0.2)", borderRadius: "8px",
              fontSize: "11px", color: "#ff3333",
            }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
              }}
              placeholder="Type a message..."
              rows={2}
              style={{
                flex: 1, padding: "10px 12px",
                background: "#111", border: "1px solid #222",
                borderRadius: "8px", color: "#e8e8e8",
                fontFamily: "'JetBrains Mono', monospace", fontSize: "12px",
                resize: "none", outline: "none", lineHeight: 1.5,
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: "42px", height: "42px", flexShrink: 0,
                background: input.trim() && !loading ? "#ff5500" : "#111",
                border: input.trim() && !loading ? "none" : "1px solid #222",
                borderRadius: "8px", color: input.trim() && !loading ? "#fff" : "#555",
                fontSize: "16px", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              →
            </button>
          </div>
          <div style={{
            marginTop: "8px", textAlign: "center",
            fontSize: "9px", color: "#333", fontFamily: "'JetBrains Mono', monospace",
          }}>
            Powered by{" "}
            <span style={{ color: "#ff5500" }}>EverydayAI</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  fontFamily: "'JetBrains Mono', monospace",
}

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "620px",
  height: "calc(100vh - 32px)",
  maxHeight: "800px",
  background: "#080808",
  border: "1px solid #1a1a1a",
  borderRadius: "16px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import axios from "axios"

interface UserData {
  email: string
  plan: string
  agentCount: number
  agentLimit: number | null
  hasOpenaiKey: boolean
}

const PLAN_COLORS: Record<string, string> = {
  free: "var(--text-muted)",
  starter: "var(--orange-400)",
  pro: "var(--orange-500)",
  agency: "var(--green-term)",
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [error, setError] = useState("")

  useEffect(() => { fetchUser() }, [])

  async function fetchUser() {
    try {
      const res = await axios.get("/api/user/me")
      setUser(res.data)
    } catch {
      setError("Failed to load account info.")
    }
  }

  async function saveApiKey() {
    if (!apiKey.trim()) return
    setSaving(true)
    setError("")
    setSaveSuccess(false)
    setTestResult(null)
    try {
      await axios.put("/api/settings/apikey", { openaiApiKey: apiKey.trim() })
      setSaveSuccess(true)
      setApiKey("")
      await fetchUser()
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch {
      setError("Failed to save API key.")
    } finally {
      setSaving(false)
    }
  }

  async function testApiKey() {
    setTesting(true)
    setTestResult(null)
    try {
      await axios.post("/api/settings/test-key")
      setTestResult({ ok: true, msg: "✓ API key is valid and connected to OpenAI." })
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.response?.data?.error || "API key test failed." })
    } finally {
      setTesting(false)
    }
  }

  async function clearApiKey() {
    if (!confirm("Clear your OpenAI API key? Your agents will stop working until you add a new one.")) return
    setClearing(true)
    try {
      await axios.delete("/api/settings/apikey")
      await fetchUser()
      setTestResult(null)
    } catch {
      setError("Failed to clear API key.")
    } finally {
      setClearing(false)
    }
  }

  const planColor = user ? (PLAN_COLORS[user.plan] ?? "var(--text-muted)") : "var(--text-muted)"
  const usagePct = user && user.agentLimit ? Math.min((user.agentCount / user.agentLimit) * 100, 100) : 0

  return (
    <div style={{ padding: "28px", maxWidth: "620px" }}>
      {/* Breadcrumb */}
      <div style={{
        fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em",
        textTransform: "uppercase", marginBottom: "18px",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <span style={{ color: "var(--orange-500)" }}>//</span>
        settings
        <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
      </div>

      <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--white)", marginBottom: "28px" }}>
        Settings
      </h1>

      {error && (
        <div style={{ background: "rgba(255,51,51,0.06)", border: "1px solid rgba(255,51,51,0.25)", color: "var(--red)", padding: "10px 14px", fontSize: "11px", marginBottom: "20px", borderRadius: "var(--radius)" }}>
          {error}
        </div>
      )}

      {/* ── Profile card ── */}
      <Card label="// account" accent>
        {user ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Row label="Email" value={user.email} />
            <Row
              label="Plan"
              value={
                <span style={{ color: planColor, fontWeight: 700, textTransform: "uppercase" }}>
                  {user.plan}
                </span>
              }
              action={
                user.plan !== "agency" && (
                  <Link href="/billing" style={{ fontSize: "10px", color: "var(--orange-400)", textDecoration: "none" }}>
                    upgrade →
                  </Link>
                )
              }
            />
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Agents Used</span>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                  {user.agentCount} / {user.agentLimit ?? "∞"}
                </span>
              </div>
              {user.agentLimit && (
                <div style={{ height: "4px", background: "var(--surface-2)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${usagePct}%`,
                    background: usagePct >= 90 ? "var(--red)" : usagePct >= 70 ? "var(--orange-500)" : "var(--green-term)",
                    borderRadius: "2px", transition: "width 0.4s ease",
                  }} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>// loading...</div>
        )}
      </Card>

      {/* ── OpenAI API Key ── */}
      <Card label="// openai api key" accent>
        {/* Status */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 14px", background: "var(--surface-0)",
          border: "var(--border)", borderRadius: "var(--radius)", marginBottom: "16px",
        }}>
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
            background: user?.hasOpenaiKey ? "var(--green-term)" : "var(--orange-500)",
          }} />
          <span style={{ fontSize: "11px", color: user?.hasOpenaiKey ? "var(--green-term)" : "var(--orange-400)" }}>
            {user?.hasOpenaiKey ? "API key configured" : "No API key — agents won't work without one"}
          </span>
          {user?.hasOpenaiKey && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "4px" }}>
              sk-••••••••••••••••
            </span>
          )}
          <div style={{ flex: 1 }} />
          {user?.hasOpenaiKey && (
            <button
              onClick={testApiKey}
              disabled={testing}
              style={{
                padding: "4px 10px", background: "transparent",
                color: testing ? "var(--text-muted)" : "var(--text-secondary)",
                border: "var(--border)", borderRadius: "var(--radius)",
                fontFamily: "var(--font-mono)", fontSize: "10px", cursor: testing ? "not-allowed" : "pointer",
              }}
            >
              {testing ? "testing..." : "test key"}
            </button>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <div style={{
            padding: "10px 14px", marginBottom: "14px", borderRadius: "var(--radius)",
            fontSize: "11px", lineHeight: 1.5,
            background: testResult.ok ? "rgba(0,255,136,0.06)" : "rgba(255,51,51,0.06)",
            border: `1px solid ${testResult.ok ? "rgba(0,255,136,0.25)" : "rgba(255,51,51,0.25)"}`,
            color: testResult.ok ? "var(--green-term)" : "var(--red)",
          }}>
            {testResult.msg}
          </div>
        )}

        {/* Save success */}
        {saveSuccess && (
          <div style={{ padding: "10px 14px", marginBottom: "14px", borderRadius: "var(--radius)", fontSize: "11px", background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.25)", color: "var(--green-term)" }}>
            ✓ API key saved successfully
          </div>
        )}

        {/* Input */}
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px", lineHeight: 1.6 }}>
          {user?.hasOpenaiKey ? "Enter a new key to replace the current one." : "Get your key at "}
          {!user?.hasOpenaiKey && (
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: "var(--orange-400)", textDecoration: "none" }}>
              platform.openai.com/api-keys
            </a>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: user?.hasOpenaiKey ? "12px" : "0" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
              placeholder="sk-..."
              style={{
                width: "100%", padding: "10px 40px 10px 12px",
                background: "var(--surface-0)", border: "var(--border)",
                color: "var(--text-primary)", fontFamily: "var(--font-mono)",
                fontSize: "12px", outline: "none", borderRadius: "var(--radius)",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => setShowKey((s) => !s)}
              style={{
                position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "var(--text-muted)",
                cursor: "pointer", fontSize: "12px", padding: "2px",
              }}
            >
              {showKey ? "🙈" : "👁"}
            </button>
          </div>
          <button
            onClick={saveApiKey}
            disabled={saving || !apiKey.trim()}
            style={{
              padding: "10px 16px", background: saving || !apiKey.trim() ? "var(--surface-3)" : "var(--orange-500)",
              color: "#fff", border: "none", borderRadius: "var(--radius)",
              fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700,
              cursor: saving || !apiKey.trim() ? "not-allowed" : "pointer", flexShrink: 0,
            }}
          >
            {saving ? "saving..." : "> save"}
          </button>
        </div>

        {user?.hasOpenaiKey && (
          <button
            onClick={clearApiKey}
            disabled={clearing}
            style={{
              padding: "7px 14px", background: "rgba(255,51,51,0.04)",
              color: clearing ? "var(--text-muted)" : "var(--red)",
              border: "1px solid rgba(255,51,51,0.2)", borderRadius: "var(--radius)",
              fontFamily: "var(--font-mono)", fontSize: "10px",
              cursor: clearing ? "not-allowed" : "pointer",
            }}
          >
            {clearing ? "clearing..." : "clear api key"}
          </button>
        )}
      </Card>

      {/* ── Notifications placeholder ── */}
      <Card label="// notifications">
        <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.7 }}>
          Email notifications for agent messages and billing events are sent to{" "}
          <span style={{ color: "var(--text-secondary)" }}>{user?.email ?? "..."}</span>.
          Manage email preferences from your account provider.
        </div>
      </Card>

      {/* ── Danger zone ── */}
      <div style={{
        background: "rgba(255,51,51,0.03)", border: "1px solid rgba(255,51,51,0.2)",
        borderRadius: "var(--radius-md)", padding: "20px",
      }}>
        <div style={{ fontSize: "10px", color: "var(--red)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
          // danger zone
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px", lineHeight: 1.6 }}>
          To permanently delete your account and all agents, email{" "}
          <a href="mailto:support@everydayai.co" style={{ color: "var(--red)", textDecoration: "none" }}>
            support@everydayai.co
          </a>{" "}
          from your registered address. This action is irreversible.
        </div>
      </div>
    </div>
  )
}

function Card({
  label,
  accent,
  children,
}: {
  label: string
  accent?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: "var(--surface-1)",
      border: "var(--border)",
      borderLeft: accent ? "2px solid var(--orange-500)" : undefined,
      borderRadius: "var(--radius-md)",
      padding: "20px",
      marginBottom: "16px",
    }}>
      <div style={{ fontSize: "10px", color: "var(--orange-400)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Row({
  label,
  value,
  action,
}: {
  label: string
  value: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
      <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{value}</span>
        {action}
      </div>
    </div>
  )
}

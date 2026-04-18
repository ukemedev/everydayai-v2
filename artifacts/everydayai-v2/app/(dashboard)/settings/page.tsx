"use client"

import { useState } from "react"
import axios from "axios"

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function saveApiKey() {
    if (!apiKey.trim()) return
    setSaving(true)
    setError("")
    setSuccess(false)
    try {
      await axios.put("/api/settings/apikey", { openaiApiKey: apiKey })
      setSuccess(true)
      setApiKey("")
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError("Failed to save API key")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: "28px", maxWidth: "600px" }}>
      <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "var(--orange-500)" }}>//</span>
        settings
        <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
      </div>

      <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--white)", marginBottom: "24px" }}>
        Settings
      </h1>

      <div style={{ background: "var(--surface-1)", border: "var(--border)", borderLeft: "2px solid var(--orange-500)", borderRadius: "var(--radius-md)", padding: "20px", marginBottom: "20px" }}>
        <div style={{ fontSize: "10px", color: "var(--orange-400)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
          // openai api key
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.6 }}>
          Your API key is stored securely and used to power your agents. Get yours at platform.openai.com
        </div>

        {error && (
          <div style={{ background: "rgba(255,51,51,0.08)", border: "1px solid rgba(255,51,51,0.25)", color: "var(--red)", padding: "10px 14px", fontSize: "11px", marginBottom: "14px", borderRadius: "var(--radius)" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", color: "var(--green-term)", padding: "10px 14px", fontSize: "11px", marginBottom: "14px", borderRadius: "var(--radius)" }}>
            ✓ API key saved successfully
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{ flex: 1, padding: "10px 14px", background: "var(--surface-0)", border: "var(--border)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "13px", outline: "none", borderRadius: "var(--radius)" }}
          />
          <button
            onClick={saveApiKey}
            disabled={saving || !apiKey.trim()}
            style={{ padding: "10px 18px", background: "var(--orange-500)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "saving..." : "> save"}
          </button>
        </div>
      </div>

      <div style={{ background: "var(--surface-1)", border: "var(--border)", borderRadius: "var(--radius-md)", padding: "20px" }}>
        <div style={{ fontSize: "10px", color: "var(--orange-400)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
          // account
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Manage your account details and subscription from the billing page.
        </div>
      </div>
    </div>
  )
}

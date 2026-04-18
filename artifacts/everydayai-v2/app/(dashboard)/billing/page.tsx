"use client"

import { useState, useEffect } from "react"
import axios from "axios"

const PLANS = [
  {
    id: "free",
    name: "// free",
    price: "$0",
    period: "forever",
    features: ["1 agent", "100 messages/mo", "Widget deployment", "Knowledge base upload"],
    color: "var(--text-muted)",
  },
  {
    id: "starter",
    name: "// starter",
    price: "$9",
    period: "/month",
    features: ["5 agents", "Unlimited messages", "Widget deployment", "Badge removed"],
    color: "var(--orange-400)",
  },
  {
    id: "pro",
    name: "// pro",
    price: "$22",
    period: "/month",
    features: ["12 agents", "Unlimited messages", "WhatsApp deployment", "Instagram DMs", "Lead capture"],
    color: "var(--orange-500)",
  },
  {
    id: "agency",
    name: "// agency",
    price: "$75",
    period: "/month",
    features: ["Unlimited agents", "Unlimited messages", "All channels", "AI Voice calls", "White label", "Client sub-accounts"],
    color: "var(--green-term)",
  },
]

interface UserData {
  email: string
  plan: string
  agentCount: number
  agentLimit: number | null
}

export default function BillingPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUser()
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    document.body.appendChild(script)
  }, [])

  async function fetchUser() {
    try {
      const res = await axios.get("/api/user/me")
      setUserData(res.data)
    } catch {
      setError("Failed to load account info")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade(planId: string) {
    if (!userData || planId === "free") return
    setPaying(planId)
    setError("")
    const PRICES: Record<string, number> = {
      starter: 900, pro: 2200, agency: 7500,
    }
    try {
      const PaystackPop = (window as any).PaystackPop
      if (!PaystackPop) {
        setError("Payment system not loaded. Please refresh.")
        setPaying(null)
        return
      }
      const handler = PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: userData.email,
        amount: PRICES[planId] * 100,
        currency: "USD",
        callback: async (response: any) => {
          try {
            await axios.post("/api/billing/verify", {
              reference: response.reference,
              plan: planId,
            })
            await fetchUser()
          } catch {
            setError("Payment verified but plan update failed.")
          } finally {
            setPaying(null)
          }
        },
        onClose: () => setPaying(null),
      })
      handler.openIframe()
    } catch {
      setError("Failed to initiate payment")
      setPaying(null)
    }
  }

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "var(--orange-500)" }}>//</span>
        billing
        <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
      </div>
      <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--white)", marginBottom: "6px" }}>
        Billing & Plans
      </h1>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "24px" }}>
        Upgrade your plan to unlock more agents and features
      </p>
      {error && (
        <div style={{ background: "rgba(255,51,51,0.08)", border: "1px solid rgba(255,51,51,0.25)", color: "var(--red)", padding: "10px 14px", fontSize: "11px", marginBottom: "18px", borderRadius: "var(--radius)" }}>
          {error}
        </div>
      )}
      {!loading && userData && (
        <div style={{ background: "var(--surface-1)", border: "var(--border)", borderLeft: "2px solid var(--orange-500)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginBottom: "28px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>current plan</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--orange-400)", textTransform: "uppercase" }}>{userData.plan}</div>
          </div>
          <div style={{ width: "1px", height: "40px", background: "var(--surface-3)" }} />
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>agents used</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--white)" }}>
              {userData.agentCount} / {userData.agentLimit ?? "∞"}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
        {PLANS.map(plan => {
          const isCurrent = userData?.plan === plan.id
          return (
            <div key={plan.id} style={{ background: "var(--surface-1)", border: isCurrent ? `1px solid ${plan.color}` : "var(--border)", borderRadius: "var(--radius-md)", padding: "20px", position: "relative" }}>
              {isCurrent && (
                <div style={{ position: "absolute", top: "12px", right: "12px", fontSize: "9px", padding: "2px 8px", background: "rgba(255,85,0,0.1)", color: plan.color, border: `1px solid ${plan.color}`, borderRadius: "var(--radius)" }}>
                  current
                </div>
              )}
              <div style={{ fontSize: "10px", color: plan.color, letterSpacing: "0.12em", marginBottom: "8px" }}>{plan.name}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "32px", fontWeight: 700, color: "var(--white)", lineHeight: 1, marginBottom: "4px" }}>
                {plan.price}
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 400 }}>{plan.period}</span>
              </div>
              <div style={{ height: "1px", background: "var(--surface-2)", margin: "16px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                {plan.features.map(f => (
                  <div key={f} style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: plan.color }}>›</span>
                    {f}
                  </div>
                ))}
              </div>
              {plan.id !== "free" && !isCurrent && (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={paying === plan.id}
                  style={{ width: "100%", padding: "9px", background: "rgba(255,85,0,0.08)", color: "var(--orange-400)", border: "1px solid rgba(255,85,0,0.2)", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, cursor: paying === plan.id ? "not-allowed" : "pointer", opacity: paying === plan.id ? 0.7 : 1 }}
                >
                  {paying === plan.id ? "// processing..." : `> upgrade to ${plan.id}`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import axios from "axios"

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    color: "var(--text-muted)",
    features: [
      "1 agent",
      "100 messages / month",
      "Widget deployment",
      "Knowledge base",
      "Community templates",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$9",
    period: "/month",
    color: "var(--orange-400)",
    features: [
      "5 agents",
      "Unlimited messages",
      "Widget deployment",
      "EverydayAI badge removed",
      "Priority support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$22",
    period: "/month",
    color: "var(--orange-500)",
    popular: true,
    features: [
      "12 agents",
      "Unlimited messages",
      "All deployment options",
      "Lead capture forms",
      "Analytics dashboard",
      "Custom branding",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "$75",
    period: "/month",
    color: "var(--green-term)",
    features: [
      "Unlimited agents",
      "Unlimited messages",
      "All channels incl. Voice",
      "White label",
      "Client sub-accounts",
      "Dedicated support",
    ],
  },
]

const PLAN_LIMITS: Record<string, number | null> = {
  free: 1,
  starter: 5,
  pro: 12,
  agency: null,
}

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
  const [success, setSuccess] = useState("")
  const hasPaystack = !!(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY)

  useEffect(() => {
    fetchUser()
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    document.body.appendChild(script)
  }, [])

  async function fetchUser() {
    setLoading(true)
    try {
      const res = await axios.get("/api/user/me")
      setUserData(res.data)
    } catch {
      setError("Failed to load account info.")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade(planId: string) {
    if (!userData || planId === userData.plan) return
    setPaying(planId)
    setError("")
    setSuccess("")

    const PRICES: Record<string, number> = { starter: 9, pro: 22, agency: 75 }

    try {
      const PaystackPop = (window as any).PaystackPop
      if (!PaystackPop) {
        setError("Payment SDK not loaded. Please refresh the page.")
        setPaying(null)
        return
      }
      const key = (window as any).__NEXT_DATA__?.props?.pageProps?.paystackKey
        || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      if (!key) {
        setError("Paystack public key not configured. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to your environment secrets.")
        setPaying(null)
        return
      }
      const handler = PaystackPop.setup({
        key,
        email: userData.email,
        amount: PRICES[planId] * 100,
        currency: "USD",
        callback: async (response: any) => {
          try {
            await axios.post("/api/billing/verify", {
              reference: response.reference,
              plan: planId,
            })
            setSuccess(`✓ Upgraded to ${planId} plan successfully!`)
            await fetchUser()
          } catch {
            setError("Payment received but plan update failed. Please contact support.")
          } finally {
            setPaying(null)
          }
        },
        onClose: () => setPaying(null),
      })
      handler.openIframe()
    } catch {
      setError("Failed to initiate payment. Please try again.")
      setPaying(null)
    }
  }

  const currentPlan = userData?.plan ?? "free"
  const agentLimit = PLAN_LIMITS[currentPlan]
  const usagePct = agentLimit && userData
    ? Math.min((userData.agentCount / agentLimit) * 100, 100)
    : 0

  return (
    <div style={{ padding: "28px", maxWidth: "900px" }}>
      {/* Breadcrumb */}
      <div style={{
        fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em",
        textTransform: "uppercase", marginBottom: "18px",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <span style={{ color: "var(--orange-500)" }}>//</span>
        billing
        <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
      </div>

      <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--white)", marginBottom: "6px" }}>
        Billing & Plans
      </h1>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "24px" }}>
        Upgrade to unlock more agents, channels, and features.
      </p>

      {/* Alerts */}
      {error && (
        <div style={{ background: "rgba(255,51,51,0.06)", border: "1px solid rgba(255,51,51,0.25)", color: "var(--red)", padding: "10px 14px", fontSize: "11px", marginBottom: "16px", borderRadius: "var(--radius)" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.25)", color: "var(--green-term)", padding: "10px 14px", fontSize: "11px", marginBottom: "16px", borderRadius: "var(--radius)" }}>
          {success}
        </div>
      )}

      {/* Current plan summary */}
      {!loading && userData && (
        <div style={{
          background: "var(--surface-1)", border: "var(--border)",
          borderLeft: "2px solid var(--orange-500)",
          borderRadius: "var(--radius-md)", padding: "20px", marginBottom: "28px",
        }}>
          <div style={{ fontSize: "10px", color: "var(--orange-400)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>
            // current plan
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Plan</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "22px", fontWeight: 700, color: "var(--orange-400)", textTransform: "uppercase" }}>
                {currentPlan}
              </div>
            </div>
            <div style={{ width: "1px", background: "var(--surface-3)", alignSelf: "stretch" }} />
            <div style={{ flex: 1, minWidth: "160px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Agents used</span>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                  {userData.agentCount} / {agentLimit ?? "∞"}
                </span>
              </div>
              {agentLimit && (
                <div style={{ height: "6px", background: "var(--surface-2)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${usagePct}%`, borderRadius: "3px",
                    background: usagePct >= 90 ? "var(--red)" : usagePct >= 70 ? "var(--orange-500)" : "var(--green-term)",
                    transition: "width 0.5s ease",
                  }} />
                </div>
              )}
              {usagePct >= 90 && agentLimit && (
                <div style={{ fontSize: "10px", color: "var(--red)", marginTop: "6px" }}>
                  Almost at your agent limit — consider upgrading.
                </div>
              )}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", alignSelf: "center" }}>
              <span style={{ color: "var(--text-muted)" }}>Email: </span>{userData.email}
            </div>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const isDowngrade = PLANS.findIndex(p => p.id === currentPlan) >
            PLANS.findIndex(p => p.id === plan.id)

          return (
            <div
              key={plan.id}
              style={{
                background: "var(--surface-1)",
                border: isCurrent ? `1px solid ${plan.color}` : "var(--border)",
                borderRadius: "var(--radius-md)", padding: "20px",
                position: "relative", display: "flex", flexDirection: "column",
              }}
            >
              {(plan as any).popular && !isCurrent && (
                <div style={{
                  position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                  fontSize: "9px", padding: "2px 10px", borderRadius: "10px",
                  background: "var(--orange-500)", color: "#fff", fontFamily: "var(--font-mono)",
                  whiteSpace: "nowrap",
                }}>
                  most popular
                </div>
              )}
              {isCurrent && (
                <div style={{
                  position: "absolute", top: "12px", right: "12px",
                  fontSize: "9px", padding: "2px 8px", borderRadius: "var(--radius)",
                  background: `${plan.color}15`, color: plan.color,
                  border: `1px solid ${plan.color}40`,
                }}>
                  current
                </div>
              )}

              <div style={{ fontSize: "10px", color: plan.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
                // {plan.name}
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "30px", fontWeight: 700, color: "var(--white)", lineHeight: 1, marginBottom: "4px" }}>
                {plan.price}
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>{plan.period}</span>
              </div>

              <div style={{ height: "1px", background: "var(--surface-2)", margin: "14px 0" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "7px", flex: 1, marginBottom: "18px" }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ color: plan.color, marginTop: "1px" }}>›</span>
                    {f}
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div style={{ padding: "8px", textAlign: "center", fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", border: "1px solid var(--border-color)", borderRadius: "var(--radius)" }}>
                  current plan
                </div>
              ) : plan.id === "free" ? (
                isDowngrade && (
                  <div style={{ padding: "8px", textAlign: "center", fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    contact support to downgrade
                  </div>
                )
              ) : !isDowngrade ? (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={!!paying}
                  style={{
                    width: "100%", padding: "9px",
                    background: paying === plan.id ? "var(--surface-3)" : "rgba(255,85,0,0.1)",
                    color: paying === plan.id ? "var(--text-muted)" : "var(--orange-400)",
                    border: "1px solid rgba(255,85,0,0.25)", borderRadius: "var(--radius)",
                    fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700,
                    cursor: paying ? "not-allowed" : "pointer",
                  }}
                >
                  {paying === plan.id ? "// processing..." : `> upgrade to ${plan.name}`}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Paystack note */}
      <div style={{
        marginTop: "24px", padding: "14px 18px",
        background: "var(--surface-1)", border: "var(--border)",
        borderRadius: "var(--radius-md)", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.7,
      }}>
        <span style={{ color: "var(--orange-500)" }}>//</span> Payments are processed securely via{" "}
        <a href="https://paystack.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--orange-400)", textDecoration: "none" }}>
          Paystack
        </a>.{" "}
        All plans are billed monthly and can be cancelled anytime. For invoices or custom enterprise pricing, email{" "}
        <a href="mailto:billing@everydayai.co" style={{ color: "var(--orange-400)", textDecoration: "none" }}>
          billing@everydayai.co
        </a>.
      </div>
    </div>
  )
}

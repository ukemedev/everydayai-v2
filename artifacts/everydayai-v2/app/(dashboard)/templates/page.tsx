"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import {
  SYSTEM_TEMPLATES,
  TEMPLATE_CATEGORIES,
  CATEGORY_COLORS,
  type SystemTemplate,
} from "@/lib/system-templates"

interface CommunityTemplate {
  id: number
  name: string
  description: string | null
  model: string
  systemPrompt: string | null
  templateCategory: string | null
  ownerId: string
  createdAt: string
}

interface TemplatesData {
  system: SystemTemplate[]
  community: CommunityTemplate[]
  currentUserId: string | null
}

export default function TemplatesPage() {
  const router = useRouter()
  const [data, setData] = useState<TemplatesData>({ system: SYSTEM_TEMPLATES, community: [], currentUserId: null })
  const [activeCategory, setActiveCategory] = useState("All")
  const [usingId, setUsingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    axios.get("/api/templates").then((r) => setData(r.data)).catch(() => {})
  }, [])

  async function useTemplate(id: string | number, isSystem: boolean) {
    setError("")
    setUsingId(String(id))
    try {
      const res = await axios.post("/api/templates", { templateId: id, isSystem })
      router.push(`/agents/${res.data.id}`)
    } catch (e: any) {
      const msg = e.response?.data?.error || "Failed to use template."
      setError(
        msg.startsWith("NO_API_KEY:")
          ? "Add your OpenAI API key in Settings first."
          : msg.startsWith("PLAN_LIMIT:")
          ? msg.replace("PLAN_LIMIT: ", "")
          : msg
      )
      setUsingId(null)
    }
  }

  const filterTemplates = <T extends { category?: string; templateCategory?: string | null }>(
    items: T[]
  ) => {
    if (activeCategory === "All") return items
    return items.filter(
      (t) => (t.category || t.templateCategory) === activeCategory
    )
  }

  const filteredSystem = filterTemplates(data.system)
  const filteredCommunity = filterTemplates(
    data.community.filter((t) => t.ownerId !== data.currentUserId)
  )
  const myTemplates = filterTemplates(
    data.community.filter((t) => t.ownerId === data.currentUserId)
  )

  return (
    <div style={{ padding: "28px", maxWidth: "1040px" }}>
      {/* Breadcrumb */}
      <div style={{
        fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em",
        textTransform: "uppercase", marginBottom: "18px",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <span style={{ color: "var(--orange-500)" }}>//</span>
        templates
        <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700,
          color: "var(--white)", marginBottom: "6px",
        }}>
          Agent Templates
        </h1>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Start from a pre-built template. Customise the prompt, add your knowledge base, and deploy in minutes.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(255,51,51,0.06)", border: "1px solid rgba(255,51,51,0.25)",
          color: "var(--red)", padding: "10px 14px", fontSize: "11px",
          marginBottom: "20px", borderRadius: "var(--radius)",
        }}>
          {error}
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "6px 14px", borderRadius: "var(--radius)",
              background: activeCategory === cat ? "var(--orange-500)" : "var(--surface-2)",
              color: activeCategory === cat ? "#fff" : "var(--text-secondary)",
              border: activeCategory === cat ? "none" : "1px solid var(--border-color)",
              fontFamily: "var(--font-mono)", fontSize: "11px", cursor: "pointer",
              transition: "var(--transition)",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* System templates */}
      <Section title="Pre-built Templates" count={filteredSystem.length}>
        <TemplateGrid>
          {filteredSystem.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              id={tpl.id}
              icon={tpl.icon}
              name={tpl.name}
              description={tpl.description}
              category={tpl.category}
              model={tpl.model}
              isSystem
              isUsing={usingId === tpl.id}
              onUse={() => useTemplate(tpl.id, true)}
            />
          ))}
        </TemplateGrid>
        {filteredSystem.length === 0 && (
          <EmptyState message="No pre-built templates in this category." />
        )}
      </Section>

      {/* My published templates */}
      {myTemplates.length > 0 && (
        <Section title="My Published Templates" count={myTemplates.length}>
          <TemplateGrid>
            {myTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                id={String(tpl.id)}
                icon="⭐"
                name={tpl.name}
                description={tpl.description}
                category={tpl.templateCategory}
                model={tpl.model}
                isSystem={false}
                isUsing={usingId === String(tpl.id)}
                onUse={() => useTemplate(tpl.id, false)}
                isMine
              />
            ))}
          </TemplateGrid>
        </Section>
      )}

      {/* Community templates */}
      {filteredCommunity.length > 0 && (
        <Section title="Community Templates" count={filteredCommunity.length}>
          <TemplateGrid>
            {filteredCommunity.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                id={String(tpl.id)}
                icon="🌐"
                name={tpl.name}
                description={tpl.description}
                category={tpl.templateCategory}
                model={tpl.model}
                isSystem={false}
                isUsing={usingId === String(tpl.id)}
                onUse={() => useTemplate(tpl.id, false)}
              />
            ))}
          </TemplateGrid>
        </Section>
      )}
    </div>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px",
      }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 700, color: "var(--white)" }}>
          {title}
        </span>
        <span style={{
          fontSize: "9px", padding: "2px 7px", borderRadius: "var(--radius)",
          background: "var(--surface-2)", color: "var(--text-muted)", border: "var(--border)",
        }}>
          {count}
        </span>
        <div style={{ flex: 1, height: "1px", background: "var(--surface-2)" }} />
      </div>
      {children}
    </div>
  )
}

function TemplateGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "16px",
    }}>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: "32px", textAlign: "center",
      background: "var(--surface-1)", border: "var(--border)",
      borderRadius: "var(--radius-md)", fontSize: "11px", color: "var(--text-muted)",
    }}>
      {message}
    </div>
  )
}

function TemplateCard({
  id,
  icon,
  name,
  description,
  category,
  model,
  isSystem,
  isUsing,
  onUse,
  isMine,
}: {
  id: string
  icon: string
  name: string
  description: string | null
  category?: string | null
  model: string
  isSystem: boolean
  isUsing: boolean
  onUse: () => void
  isMine?: boolean
}) {
  const catColor = category ? (CATEGORY_COLORS[category] ?? "#888") : "#888"

  return (
    <div style={{
      background: "var(--surface-1)", border: "var(--border)",
      borderRadius: "var(--radius-md)", padding: "20px",
      display: "flex", flexDirection: "column", gap: "12px",
      transition: "var(--transition)",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "var(--radius-md)",
          background: "var(--surface-2)", border: "var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 700,
            color: "var(--white)", marginBottom: "4px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {name}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {category && (
              <span style={{
                fontSize: "9px", padding: "2px 7px", borderRadius: "var(--radius)",
                color: catColor,
                background: `${catColor}15`,
                border: `1px solid ${catColor}30`,
              }}>
                {category}
              </span>
            )}
            <span style={{
              fontSize: "9px", padding: "2px 7px", borderRadius: "var(--radius)",
              color: "var(--text-muted)", background: "var(--surface-2)", border: "var(--border)",
            }}>
              {model}
            </span>
            {isMine && (
              <span style={{
                fontSize: "9px", padding: "2px 7px", borderRadius: "var(--radius)",
                color: "var(--orange-400)", background: "rgba(255,85,0,0.08)",
                border: "1px solid rgba(255,85,0,0.2)",
              }}>
                yours
              </span>
            )}
            {isSystem && (
              <span style={{
                fontSize: "9px", padding: "2px 7px", borderRadius: "var(--radius)",
                color: "var(--green-term)", background: "rgba(0,255,136,0.06)",
                border: "1px solid rgba(0,255,136,0.15)",
              }}>
                official
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div style={{
          fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.65,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {description}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onUse}
        disabled={isUsing}
        style={{
          marginTop: "auto",
          padding: "9px 16px",
          background: isUsing ? "var(--surface-3)" : "var(--orange-500)",
          color: isUsing ? "var(--text-muted)" : "#fff",
          border: "none", borderRadius: "var(--radius)",
          fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700,
          cursor: isUsing ? "not-allowed" : "pointer",
          transition: "var(--transition)",
        }}
      >
        {isUsing ? "// creating..." : "> use template"}
      </button>
    </div>
  )
}

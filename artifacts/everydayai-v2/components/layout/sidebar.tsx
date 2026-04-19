"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

const navItems = [
  { prefix: "01", label: "dashboard", href: "/dashboard" },
  { prefix: "02", label: "agents", href: "/agents" },
  { prefix: "03", label: "knowledge", href: "/knowledge" },
  { prefix: "04", label: "billing", href: "/billing" },
  { prefix: "05", label: "settings", href: "/settings" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) setIsOpen(false)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) setIsOpen(false)
  }, [pathname, isMobile])

  const sidebarStyle: React.CSSProperties = {
    width: "220px",
    minHeight: "100vh",
    background: "var(--surface-0)",
    borderRight: "var(--border)",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    transform: isMobile && !isOpen ? "translateX(-100%)" : "translateX(0)",
    transition: "transform 0.22s ease",
  }

  return (
    <>
      {/* ── Mobile hamburger ── */}
      {isMobile && (
        <button
          onClick={() => setIsOpen((o) => !o)}
          style={{
            position: "fixed",
            top: "12px",
            left: "12px",
            zIndex: 200,
            background: "var(--surface-1)",
            border: "var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--white)",
            padding: "7px 10px",
            cursor: "pointer",
            fontSize: "13px",
            lineHeight: 1,
          }}
          aria-label="Toggle menu"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      )}

      {/* ── Mobile backdrop ── */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 99,
          }}
        />
      )}

      <aside style={sidebarStyle}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "var(--orange-500)", fontSize: "22px", fontWeight: 700 }}>[</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, color: "var(--white)" }}>EverydayAI</span>
            <span style={{ color: "var(--orange-500)", fontSize: "22px", fontWeight: 700 }}>]</span>
          </div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", paddingLeft: "2px", marginTop: "4px" }}>
            // v2.0.0
          </div>
        </div>

        <nav style={{ padding: "12px 10px", flex: 1 }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", padding: "8px 8px 4px" }}>
            // navigation
          </div>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "var(--radius)",
                color: isActive ? "var(--orange-400)" : "var(--text-secondary)",
                background: isActive ? "rgba(255,85,0,0.08)" : "transparent",
                border: isActive ? "1px solid rgba(255,85,0,0.2)" : "1px solid transparent",
                fontSize: "12px",
                marginBottom: "2px",
                textDecoration: "none",
                transition: "var(--transition)",
              }}>
                <span style={{ color: isActive ? "var(--orange-500)" : "var(--text-muted)", fontSize: "11px", width: "14px" }}>
                  {item.prefix}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{
          padding: "12px 10px",
          borderTop: "var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <UserButton />
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>account</span>
        </div>
      </aside>
    </>
  )
}

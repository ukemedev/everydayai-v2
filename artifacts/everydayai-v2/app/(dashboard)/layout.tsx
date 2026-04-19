import Sidebar from "@/components/layout/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        className="dashboard-main"
        style={{
          marginLeft: "220px",
          flex: 1,
          minHeight: "100vh",
          background: "var(--bg)",
        }}
      >
        {children}
      </main>
    </div>
  )
}

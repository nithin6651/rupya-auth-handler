export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#0d0d0d", color: "white" }}>
        <div style={{ display: "flex", height: "100vh" }}>

          {/* SIDEBAR */}
          <aside style={{
            width: "230px",
            background: "#111",
            padding: "20px",
            borderRight: "1px solid #222"
          }}>
            <h2 style={{ marginBottom: 20 }}>Rupya</h2>

            <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <a href="/tradingview" style={{ color: "white" }}>TradingView</a>
              <a href="/screeners" style={{ color: "white" }}>Screeners</a>
              <a href="/market" style={{ color: "white" }}>Market Data</a>
              <a href="/upstox" style={{ color: "white" }}>Upstox Login</a>
            </nav>
          </aside>

          {/* MAIN CONTENT */}
          <main style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}
